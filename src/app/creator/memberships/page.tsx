import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CreatorSidebar } from "@/components/CreatorSidebar";
import { Plus, Link as LinkIcon, ExternalLink } from "lucide-react";

export default async function MembershipsPage() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/api/auth/login");
    }

    // Fetch tiers linked to Whop plans from Supabase
    const { data: tiers } = await supabase
        .from("membership_tiers")
        .select("*")
        .eq("channel_id", user.id);

    return (
        <div className="flex h-screen bg-[#0F0F0F] text-white">
            <CreatorSidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto w-full max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Channel Memberships</h1>
                        <p className="text-gray-400 mt-1">Manage your channel tiers and Whop plan connections</p>
                    </div>
                    <button className="flex items-center gap-2 bg-[#FF7043] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#e6643c] transition-colors shadow-lg shadow-orange-500/10">
                        <Plus className="w-5 h-5" />
                        Add New Tier
                    </button>
                </div>

                <div className="space-y-6">
                    {!tiers || tiers.length === 0 ? (
                        <div className="p-12 border-2 border-dashed border-[#303030] rounded-3xl text-center">
                            <div className="w-16 h-16 bg-[#1F1F1F] rounded-full flex items-center justify-center mx-auto mb-4">
                                <LinkIcon className="w-8 h-8 text-gray-500" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">No memberships set up</h3>
                            <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                                Connect your Whop plans to channel tiers to start monetizing your content.
                            </p>
                            <button className="bg-white text-black px-6 py-2.5 rounded-full font-bold">
                                Connect your first plan
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {tiers.map((tier) => (
                                <div key={tier.id} className="p-6 bg-[#1F1F1F] border border-[#303030] rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-[#272727] rounded-xl flex items-center justify-center text-xl">
                                            💎
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">{tier.name}</h3>
                                            <p className="text-gray-400 text-sm">{tier.description || "No description provided"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Whop Plan</p>
                                            <div className="flex items-center gap-2 text-blue-400">
                                                <span className="font-mono text-sm">{tier.whop_plan_id}</span>
                                                <ExternalLink className="w-3 h-3" />
                                            </div>
                                        </div>
                                        <div className="text-right w-24">
                                            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Price</p>
                                            <p className="text-lg font-bold">${tier.price}/mo</p>
                                        </div>
                                        <button className="text-gray-400 hover:text-white p-2">
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-12 p-8 bg-[#181818] border border-[#272727] rounded-3xl">
                    <h2 className="text-xl font-bold mb-6">Whop Integration Guide</h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#FF7043]/10 text-[#FF7043] flex items-center justify-center font-bold flex-shrink-0">1</div>
                                <div>
                                    <p className="font-bold mb-1">Create plan on Whop</p>
                                    <p className="text-sm text-gray-400">Go to your Whop dashboard and create a new digital product or subscription plan.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#FF7043]/10 text-[#FF7043] flex items-center justify-center font-bold flex-shrink-0">2</div>
                                <div>
                                    <p className="font-bold mb-1">Copy Plan ID</p>
                                    <p className="text-sm text-gray-400">Retrieve the plan ID (starts with <span className="font-mono">plan_</span>) from the plan settings.</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#FF7043]/10 text-[#FF7043] flex items-center justify-center font-bold flex-shrink-0">3</div>
                                <div>
                                    <p className="font-bold mb-1">Link to YouTube Tier</p>
                                    <p className="text-sm text-gray-400">Click "Add New Tier" above and paste your Whop Plan ID to link the systems.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
