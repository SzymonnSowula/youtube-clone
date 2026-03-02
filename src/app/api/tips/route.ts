import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { whop } from "@/lib/whop";
import { createClient } from "@/lib/supabase-server";

const tipSchema = z.object({
  amount: z.number().min(1, "Minimum tip is $1"),
  channelId: z.string().min(1, "Channel ID is required"),
  message: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth();

    if (authError || !user) {
      return authError || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = tipSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { amount, channelId, message } = parsed.data;

    // Fetch Channel info to get tip plan_id
    const supabase = await createClient();
    const { data: channel, error: channelError } = await supabase
      .from("channels")
      .select("whop_company_id, whop_product_id") // Using product_id as a fallback or if plan_id isn't explicitly set
      .eq("id", channelId)
      .single();

    if (channelError || !channel?.whop_company_id) {
      return NextResponse.json({ error: "Channel not set up for tips" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Create a checkout configuration
    // Note: In a real app, you'd have a specific plan_id for tips.
    const checkoutConfig = await whop.checkoutConfigurations.create({
      plan_id: channel.whop_product_id || "plan_default", // Placeholder for actual plan_id
      metadata: {
        type: "super_chat",
        sender_id: user.id,
        channel_id: channelId,
        amount: amount.toString(),
        message: message || "",
      },
      redirect_url: `${baseUrl}/watch/${channelId}?tip_success=true`,
    });

    return NextResponse.json({ checkoutUrl: checkoutConfig.purchase_url });
  } catch (error) {
    console.error("Tip checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create tip checkout" },
      { status: 500 }
    );
  }
}
