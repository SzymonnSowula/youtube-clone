import { NextResponse } from "next/server";
import { requireCreator } from "@/lib/auth";
import { whop } from "@/lib/whop";

export async function POST() {
  try {
    const { creator, error: authError } = await requireCreator();

    if (authError || !creator) {
      return authError || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!creator.whop_company_id) {
      return NextResponse.json(
        { error: "Creator account not set up for payments." },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    // Generate link using the Whop SDK
    const accountLink = await whop.accountLinks.create({
      company_id: creator.whop_company_id,
      use_case: "payouts_portal",
      return_url: `${baseUrl}/creator/payouts?returned=true`,
      refresh_url: `${baseUrl}/creator/payouts`,
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Payout link generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate payout link" },
      { status: 500 }
    );
  }
}
