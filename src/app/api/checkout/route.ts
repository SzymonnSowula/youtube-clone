import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { whop } from "@/lib/whop";
import { requireAuth } from "@/lib/auth";

const checkoutSchema = z.object({
  channelId: z.string().min(1, "Channel ID is required"),
  tierId: z.string().min(1, "Tier ID is required"),
  channelUsername: z.string().min(1, "Channel username is required"),
});

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();

    if (authError || !user) {
      return authError || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { channelId, tierId, channelUsername } = parsed.data;
    
    // Fetch Channel & Tier info from Supabase
    const supabase = await createClient();
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("*, membership_tiers(*)")
      .eq("id", channelId)
      .single();

    if (channelError || !channel || !channel.whop_company_id) {
      return NextResponse.json(
        { error: "Channel not found or not set up for payments." },
        { status: 404 }
      );
    }

    const tier = channel.membership_tiers?.find(
      (t: { id: string }) => t.id === tierId
    );

    if (!tier || !tier.whop_plan_id) {
      return NextResponse.json(
        { error: "Tier not found or improperly configured." },
        { status: 404 }
      );
    }

    // Check existing subscription
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .match({ user_id: user.id, channel_id: channel.id })
      .single();

    if (existingSub) {
      return NextResponse.json(
        { error: "You are already a member of this channel." },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectUrl = `${baseUrl}/channel/${channelUsername}?subscribed=true`;

    // Initialize Checkout via Whop SDK
    const checkoutConfig = await whop.checkoutConfigurations.create({
      plan_id: tier.whop_plan_id,
      redirect_url: redirectUrl,
      metadata: {
        platform_user_id: user.id,
        platform_channel_id: channel.id,
        platform_tier_id: tier.id,
      },
    });

    return NextResponse.json({ checkoutUrl: checkoutConfig.purchase_url });
  } catch (error) {
    console.error("Checkout creation error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
