import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CreatorSidebar } from "@/components/CreatorSidebar";
import { LayoutDashboard, Users, PlayCircle, DollarSign, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function CreatorDashboard() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/api/auth/login");
    }

    // Fetch channel/stats
    const { data: channel } = await supabase
        .from("channels")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!channel) {
        redirect("/creator/onboarding");
    }

    const stats = [
        { label: "Total Views", value: "1.2M", icon: PlayCircle, trend: "+12%" },
        { label: "Subscribers", value: "45.2K", icon: Users, trend: "+5%" },
        { label: "Estimated Revenue", value: "$12,450", icon: DollarSign, trend: "+18%" },
        { label: "Watch Time", value: "240K hrs", icon: TrendingUp, trend: "+8%" },
    ];

    return (
        <div className="flex h-screen bg-[#0F0F0F] text-white">
            <CreatorSidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold">Channel Dashboard</h1>
                        <button className="bg-white text-black px-4 py-2 rounded-full font-medium text-sm hover:bg-gray-200 transition-colors">
                            Upload Video
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {stats.map((stat) => (
                            <div key={stat.label} className="p-6 bg-[#1F1F1F] border border-[#303030] rounded-2xl">
                                <div className="flex justify-between items-start mb-4">
                                    <stat.icon className="w-5 h-5 text-gray-400" />
                                    <span className="text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded">
                                        {stat.trend}
                                    </span>
                                </div>
                                <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-bold">{stat.value}</h3>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-8">
                            {/* Latest Video Card */}
                            <div className="p-8 bg-[#1F1F1F] border border-[#303030] rounded-2xl">
                                <h2 className="text-xl font-bold mb-6">Latest Video Performance</h2>
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="w-full md:w-64 aspect-video bg-[#272727] rounded-xl overflow-hidden flex-shrink-0">
                                        <img
                                            src="https://images.unsplash.com/photo-1627398225058-eb1da594ce2e?auto=format&fit=crop&q=80&w=1000"
                                            className="w-full h-full object-cover"
                                            alt="Thumbnail"
                                        />
                                    </div>
                                    <div className="space-y-4 flex-1">
                                        <h3 className="font-semibold text-lg leading-tight">Building a YouTube Clone with Next.js and Whop API</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-gray-400 text-xs">Views</p>
                                                <p className="font-bold">120K</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs">Click-through rate</p>
                                                <p className="font-bold">8.4%</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs">Avg view duration</p>
                                                <p className="font-bold">4:12</p>
                                            </div>
                                        </div>
                                        <Link href="/creator/content" className="inline-block text-blue-400 text-sm font-medium hover:underline">
                                            See Video Analytics
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="p-6 bg-[#1F1F1F] border border-[#303030] rounded-2xl">
                                <h2 className="text-lg font-bold mb-4">Quick Links</h2>
                                <div className="space-y-3">
                                    <Link href="/creator/payouts" className="block p-3 rounded-xl hover:bg-[#272727] transition-colors border border-transparent hover:border-[#3f3f3f]">
                                        <p className="font-medium">Payout Portal</p>
                                        <p className="text-xs text-gray-400">View and withdraw earnings</p>
                                    </Link>
                                    <Link href="/creator/memberships" className="block p-3 rounded-xl hover:bg-[#272727] transition-colors border border-transparent hover:border-[#3f3f3f]">
                                        <p className="font-medium">Memberships</p>
                                        <p className="text-xs text-gray-400">Manage your subscription tiers</p>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
