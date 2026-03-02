import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { CheckCircle, Users, PlayCircle, Subscript as Subscription } from "lucide-react";
import { VideoCard } from "@/components/VideoCard";

export default async function ChannelPage({
    params,
}: {
    params: { username: string };
}) {
    const supabase = await createClient();
    const { username } = await params;

    // Fetch channel data
    const { data: channel } = await supabase
        .from("channels")
        .select("*, users(*)")
        .eq("name", username)
        .single();

    if (!channel) {
        notFound();
    }

    // Fetch channel tiers
    const { data: tiers } = await supabase
        .from("membership_tiers")
        .select("*")
        .eq("channel_id", channel.id)
        .order("price", { ascending: true });

    // Fetch channel videos
    const { data: videos } = await supabase
        .from("videos")
        .select("*")
        .eq("channel_id", channel.id)
        .order("created_at", { ascending: false });

    return (
        <div className="w-full bg-[#0F0F0F] min-h-screen text-white">
            {/* Banner */}
            <div className="w-full h-48 md:h-64 bg-[#272727] relative overflow-hidden">
                {/* Placeholder for banner image */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-orange-900/20" />
            </div>

            <div className="max-w-[1284px] mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center mb-12">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-[#0F0F0F] bg-[#272727] -mt-20 md:-mt-24 relative z-10">
                        <img
                            src={channel.users.avatar_url || "/placeholder-avatar.jpg"}
                            alt={channel.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl md:text-4xl font-bold">{channel.name}</h1>
                            <CheckCircle className="w-6 h-6 text-gray-400" />
                        </div>
                        <div className="flex items-center gap-4 text-gray-400 text-sm">
                            <span>@{channel.name.toLowerCase().replace(/\s+/g, '')}</span>
                            <span>•</span>
                            <span>45.2K subscribers</span>
                            <span>•</span>
                            <span>120 videos</span>
                        </div>
                        <p className="text-gray-400 text-sm max-w-2xl line-clamp-2">
                            Official YouTube channel of {channel.name}. Subscribe for weekly updates on engineering and products.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200">
                            Subscribe
                        </button>
                        {tiers && tiers.length > 0 && (
                            <button className="bg-transparent border border-[#303030] text-blue-400 px-6 py-2 rounded-full font-bold hover:bg-blue-400/10">
                                Join
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-8 border-b border-[#303030] mb-8 overflow-x-auto scrollbar-hide">
                    {["Home", "Videos", "Playlists", "Community", "Memberships", "About"].map((tab) => (
                        <button
                            key={tab}
                            className={`pb-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${tab === "Home" ? "border-white text-white" : "border-transparent text-gray-400 hover:text-white"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <div className="lg:col-span-3 space-y-12">
                        <section>
                            <h2 className="text-xl font-bold mb-6 italic">Recent uploads</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-10">
                                {videos?.map((video) => (
                                    <VideoCard key={video.id} {...video} channelName={channel.name} channelAvatarUrl={channel.users.avatar_url || ""} />
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar / Tiers */}
                    <aside className="space-y-8">
                        {tiers && tiers.length > 0 && (
                            <div className="p-6 bg-[#181818] border border-[#272727] rounded-2xl">
                                <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                                    <Subscription className="w-5 h-5 text-orange-500" />
                                    Membership Tiers
                                </h2>
                                <div className="space-y-6">
                                    {tiers.map((tier) => (
                                        <div key={tier.id} className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-bold">{tier.name}</h3>
                                                    <p className="text-xl font-black text-orange-500">${tier.price}<span className="text-xs text-gray-500 font-normal">/mo</span></p>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-400">{tier.description}</p>
                                            <form action="/api/checkout" method="POST">
                                                <input type="hidden" name="tierId" value={tier.id} />
                                                <button className="w-full bg-[#FF7043] text-white py-2 rounded-full font-bold hover:bg-[#e6643c] transition-colors">
                                                    Join Tier
                                                </button>
                                            </form>
                                            <div className="h-px bg-[#303030]" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-6 bg-[#1F1F1F] rounded-2xl text-center space-y-4">
                            <p className="text-sm text-gray-400">Want to start your own channel?</p>
                            <button className="w-full bg-white text-black py-2 rounded-full font-bold">
                                Creator Studio
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
