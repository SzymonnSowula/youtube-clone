import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Use service role client to bypass RLS
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Validate Whop webhook signature (HMAC-SHA256)
function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  )
}

// Whop webhook event types we handle
type WebhookEventType =
  | 'membership_activated'
  | 'membership_deactivated'
  | 'payment_succeeded'
  | 'payment_failed'

interface WebhookPayload {
  id: string
  event: WebhookEventType
  data: Record<string, unknown>
  created_at: string
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET

    // Validate signature if secret is configured
    if (webhookSecret) {
      const signature = request.headers.get('x-whop-signature') ||
                        request.headers.get('whop-signature') || ''

      if (!signature) {
        console.error('[Webhook] Missing signature header')
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }

      try {
        const isValid = verifySignature(rawBody, signature, webhookSecret)
        if (!isValid) {
          console.error('[Webhook] Invalid signature')
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }
      } catch {
        console.error('[Webhook] Signature verification error')
        return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
      }
    }

    const payload: WebhookPayload = JSON.parse(rawBody)
    const supabase = getServiceSupabase()

    // Log the event to webhook_events audit table
    await supabase.from('webhook_events').insert({
      event_type: payload.event,
      whop_event_id: payload.id,
      payload: payload,
      processed_at: new Date().toISOString(),
    })

    // Handle specific events
    switch (payload.event) {
      case 'membership_activated':
        await handleMembershipValid(supabase, payload.data)
        break

      case 'membership_deactivated':
        await handleMembershipInvalid(supabase, payload.data)
        break

      case 'payment_succeeded':
        await handlePaymentSucceeded(supabase, payload.data)
        break

      case 'payment_failed':
        await handlePaymentFailed(supabase, payload.data)
        break

      default:
        console.log(`[Webhook] Unhandled event type: ${payload.event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Webhook] Processing error:', error)
    // Always return 200 to prevent Whop from retrying
    return NextResponse.json({ received: true, error: 'Processing error' })
  }
}

// --- Event Handlers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleMembershipValid(
  supabase: any,
  data: Record<string, unknown>,
) {
  const userId = data.user_id as string | undefined
  const product = data.product as Record<string, unknown> | undefined
  const plan = data.plan as Record<string, unknown> | undefined

  if (!userId) {
    console.error('[Webhook] membership.went_valid: missing user_id')
    return
  }

  // Look up the user by whop_id
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('whop_id', userId)
    .single()

  if (!user) {
    console.log('[Webhook] membership.went_valid: user not found for whop_id:', userId)
    return
  }

  // Look up the channel by whop_product_id or whop_company_id
  const productId = product?.id as string | undefined
  let channel = null

  if (productId) {
    const { data: ch } = await supabase
      .from('channels')
      .select('id')
      .eq('whop_product_id', productId)
      .single()
    channel = ch
  }

  if (!channel) {
    console.log('[Webhook] membership.went_valid: channel not found for product:', productId)
    return
  }

  // Find matching tier
  const planId = plan?.id as string | undefined
  let tierId = null
  if (planId) {
    const { data: tier } = await supabase
      .from('membership_tiers')
      .select('id')
      .eq('whop_plan_id', planId)
      .single()
    tierId = tier?.id || null
  }

  // Upsert subscription as active
  await supabase
    .from('subscriptions')
    .upsert(
      {
        user_id: user.id,
        channel_id: channel.id,
        tier_id: tierId,
        status: 'active',
      },
      { onConflict: 'user_id,channel_id' }
    )

  console.log('[Webhook] Subscription activated:', user.id, '->', channel.id)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleMembershipInvalid(
  supabase: any,
  data: Record<string, unknown>,
) {
  const userId = data.user_id as string | undefined
  const product = data.product as Record<string, unknown> | undefined

  if (!userId) return

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('whop_id', userId)
    .single()

  if (!user) return

  const productId = product?.id as string | undefined
  let channel = null
  if (productId) {
    const { data: ch } = await supabase
      .from('channels')
      .select('id')
      .eq('whop_product_id', productId)
      .single()
    channel = ch
  }

  if (!channel) return

  // Mark subscription as cancelled
  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled' })
    .match({ user_id: user.id, channel_id: channel.id })

  console.log('[Webhook] Subscription cancelled:', user.id, '->', channel.id)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentSucceeded(
  supabase: any,
  data: Record<string, unknown>,
) {
  const paymentId = data.id as string
  const user = data.user as Record<string, unknown> | undefined
  const company = data.company as Record<string, unknown> | undefined
  const total = (data.usd_total as number) ?? (data.total as number) ?? 0

  if (!paymentId || !company?.id) return

  // Find channel by whop_company_id
  const { data: channel } = await supabase
    .from('channels')
    .select('id')
    .eq('whop_company_id', company.id as string)
    .single()

  if (!channel) return

  await supabase.from('payment_records').upsert(
    {
      channel_id: channel.id,
      whop_payment_id: paymentId,
      amount: total,
      currency: (data.currency as string) || 'usd',
      status: 'paid',
      billing_reason: data.billing_reason as string || null,
      card_brand: data.card_brand as string || null,
      card_last4: data.card_last4 as string || null,
      user_email: user?.email as string || null,
      user_name: user?.name as string || null,
      whop_user_id: user?.id as string || null,
      refunded_amount: (data.refunded_amount as number) || 0,
      paid_at: data.paid_at as string || new Date().toISOString(),
    },
    { onConflict: 'whop_payment_id' }
  )

  console.log('[Webhook] Payment recorded:', paymentId, '$' + total)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentFailed(
  supabase: any,
  data: Record<string, unknown>,
) {
  const paymentId = data.id as string
  const company = data.company as Record<string, unknown> | undefined
  const user = data.user as Record<string, unknown> | undefined

  if (!paymentId || !company?.id) return

  const { data: channel } = await supabase
    .from('channels')
    .select('id')
    .eq('whop_company_id', company.id as string)
    .single()

  if (!channel) return

  await supabase.from('payment_records').upsert(
    {
      channel_id: channel.id,
      whop_payment_id: paymentId,
      amount: (data.total as number) || 0,
      currency: (data.currency as string) || 'usd',
      status: 'failed',
      billing_reason: data.billing_reason as string || null,
      user_email: user?.email as string || null,
      user_name: user?.name as string || null,
      whop_user_id: user?.id as string || null,
      paid_at: null,
    },
    { onConflict: 'whop_payment_id' }
  )

  console.log('[Webhook] Failed payment recorded:', paymentId)
}
