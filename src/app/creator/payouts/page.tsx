import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CreatorSidebar } from "@/components/CreatorSidebar";
import PayoutButton from "./PayoutButton";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function PayoutsPage({
    searchParams,
}: {
    searchParams: { returned?: string };
}) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/api/auth/login");
    }

    // Get channel data
    const { data: channel, error: channelError } = await supabase
        .from("channels")
        .select("*")
        .eq("id", user.id)
        .single();

    if (channelError || !channel) {
        redirect("/creator/onboarding"); // Assuming an onboarding flow exists
    }

    const { returned } = searchParams;

    return (
        <div className="flex h-screen bg-[#0F0F0F] text-white">
            <CreatorSidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto w-full max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Payouts</h1>
                        <p className="text-gray-400 mt-1">
                            Manage your channel earnings and withdrawals
                        </p>
                    </div>
                    <Link
                        href="/creator/dashboard"
                        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>

                {returned === "true" && (
                    <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <p className="text-green-400 font-medium">
                            Payout settings updated successfully.
                        </p>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-8 bg-[#1F1F1F] border border-[#303030] rounded-2xl flex flex-col justify-center">
                        <h2 className="text-xl font-semibold mb-3">Payout Portal</h2>
                        <p className="text-gray-400 mb-8 leading-relaxed">
                            Access Whop&apos;s secured payout portal to view your available balance, complete identity verification, add payout methods, and withdraw your earnings directly to your bank account.
                        </p>
                        <PayoutButton />
                    </div>

                    <div className="p-8 bg-[#181818] border border-[#272727] rounded-2xl">
                        <h3 className="font-semibold text-lg mb-4">How payouts work</h3>
                        <ul className="text-gray-400 space-y-4">
                            <li className="flex gap-3">
                                <span className="text-blue-500 font-bold">1.</span>
                                <p>Viewer payments (Memberships, Super Chats) go to your Whop company balance.</p>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-blue-500 font-bold">2.</span>
                                <p>Complete identity verification (KYC) to enable withdrawals.</p>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-blue-500 font-bold">3.</span>
                                <p>Add a bank account or other supported payout method.</p>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-blue-500 font-bold">4.</span>
                                <p>Withdraw funds manually or set up automatic monthly payouts.</p>
                            </li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}
