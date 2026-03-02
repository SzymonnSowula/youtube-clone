import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CreatorSidebar } from "@/components/CreatorSidebar";
import PayoutButton from "./PayoutButton";
import { DollarSign, ArrowUpRight, Clock, ShieldCheck, Wallet } from "lucide-react";

export default async function PayoutsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/api/auth/login");
    }

    const { data: creator } = await supabase
        .from("channels")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!creator) {
        redirect("/creator/onboarding");
    }

    const stats = [
        { label: "Total Earned", value: "$12,450.00", icon: DollarSign, color: "text-green-500" },
        { label: "Available to Withdraw", value: "$4,200.00", icon: Wallet, color: "text-blue-500" },
        { label: "Pending Payout", value: "$850.20", icon: Clock, color: "text-orange-500" },
    ];

    return (
        <div className="flex h-screen bg-[#0F0F0F] text-white">
            <CreatorSidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-10">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Earnings & Payouts</h1>
                        <p className="text-gray-400">Manage your revenue and withdrawal methods through Whop's secure portal.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat) => (
                            <div key={stat.label} className="p-6 bg-[#1F1F1F] border border-[#303030] rounded-2xl relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${stat.color}`}>
                                    <stat.icon className="w-12 h-12" />
                                </div>
                                <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-bold">{stat.value}</h3>
                            </div>
                        ))}
                    </div>

                    <div className="p-10 bg-gradient-to-br from-[#1F1F1F] to-[#161616] border border-[#303030] rounded-[32px] text-center space-y-8">
                        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto border border-white/10 shadow-2xl">
                            <img src="https://whop.com/logo.png" className="w-10 h-10 object-contain" alt="Whop" />
                        </div>
                        <div className="space-y-3 max-w-md mx-auto">
                            <h2 className="text-2xl font-bold">Secure Payout Portal</h2>
                            <p className="text-gray-400">
                                Withdraw your funds to your bank account, manage tax documents (KYC), and view detailed transaction history.
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-6">
                            <PayoutButton />

                            <div className="flex gap-8 text-xs text-gray-500 font-medium">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-green-500/50" />
                                    SECURE KYC
                                </div>
                                <div className="flex items-center gap-2">
                                    <ArrowUpRight className="w-4 h-4 text-blue-500/50" />
                                    INSTANT WITHDRAWALS
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                        <div className="p-6 bg-[#1F1F1F] border border-[#303030] rounded-2xl space-y-4">
                            <h3 className="font-bold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gray-400" />
                                Recent Transactions
                            </h3>
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <div className="flex gap-3 items-center">
                                            <div className="w-8 h-8 bg-[#272727] rounded-full flex items-center justify-center">
                                                <DollarSign className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium">Channel Membership</p>
                                                <p className="text-xs text-gray-500">Mar 2, 2024</p>
                                            </div>
                                        </div>
                                        <span className="text-green-500 font-bold">+$12.99</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 bg-[#1F1F1F] border border-[#303030] rounded-2xl space-y-4">
                            <h3 className="font-bold">Next Payout</h3>
                            <div className="space-y-2">
                                <p className="text-4xl font-bold">$4,200.00</p>
                                <p className="text-sm text-gray-400">Scheduled for Monday, March 4th</p>
                            </div>
                            <div className="h-1 bg-[#272727] rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-3/4" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
