import { NextRequest, NextResponse } from 'next/server'
import { requireCreator } from '@/lib/auth'
import { whop } from '@/lib/whop'

export async function GET(request: NextRequest) {
  try {
    const { creator, error: authError } = await requireCreator()

    if (authError || !creator) {
      return authError || NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!creator.whop_company_id) {
      return NextResponse.json({
        payments: [],
        stats: {
          totalRevenue: '0.00',
          totalPayments: 0,
          refundedAmount: '0.00',
          avgPayment: '0.00',
        },
        message: 'Whop company not connected. Connect your Whop company to see real revenue data.',
      })
    }

    // Parse optional filters from query params
    const searchParams = request.nextUrl.searchParams
    const billingReason = searchParams.get('billing_reason')
    const createdAfter = searchParams.get('created_after')
    const createdBefore = searchParams.get('created_before')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Build Whop API query
    const listParams: Record<string, unknown> = {
      company_id: creator.whop_company_id,
      first: limit,
      order: 'created_at' as const,
      direction: 'desc' as const,
    }

    if (billingReason && billingReason !== 'all') {
      listParams.billing_reasons = [billingReason]
    }
    if (createdAfter) {
      listParams.created_after = createdAfter
    }
    if (createdBefore) {
      listParams.created_before = createdBefore
    }

    // Fetch payments from Whop
    const paymentsPage = await whop.payments.list(listParams as Parameters<typeof whop.payments.list>[0])

    // Collect all payment data
    const allPayments: Array<Record<string, unknown>> = []
    for await (const payment of paymentsPage) {
      allPayments.push({
        id: payment.id,
        amount: payment.usd_total ?? payment.total ?? 0,
        currency: payment.currency || 'usd',
        status: payment.status,
        substatus: payment.substatus,
        billing_reason: payment.billing_reason,
        card_brand: payment.card_brand,
        card_last4: payment.card_last4,
        payment_method_type: payment.payment_method_type,
        user: payment.user ? {
          id: payment.user.id,
          name: payment.user.name,
          email: payment.user.email,
          username: payment.user.username,
        } : null,
        product: payment.product ? {
          id: payment.product.id,
          title: payment.product.title,
        } : null,
        refundable: payment.refundable,
        refunded_amount: payment.refunded_amount,
        refunded_at: payment.refunded_at,
        paid_at: payment.paid_at,
        created_at: payment.created_at,
        metadata: payment.metadata,
      })

      // Cap at limit to avoid over-fetching
      if (allPayments.length >= limit) break
    }

    // Compute aggregate stats
    let totalRevenue = 0
    let refundedAmount = 0
    let paidCount = 0

    for (const p of allPayments) {
      const amount = (p.amount as number) || 0
      const refunded = (p.refunded_amount as number) || 0

      if (p.status === 'paid') {
        totalRevenue += amount
        paidCount++
      }
      refundedAmount += refunded
    }

    const avgPayment = paidCount > 0 ? totalRevenue / paidCount : 0

    return NextResponse.json({
      payments: allPayments,
      stats: {
        totalRevenue: totalRevenue.toFixed(2),
        totalPayments: paidCount,
        refundedAmount: refundedAmount.toFixed(2),
        avgPayment: avgPayment.toFixed(2),
      },
    })
  } catch (error) {
    console.error('[Payments API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment data' },
      { status: 500 }
    )
  }
}
