import { createClient } from "@/lib/supabase-server";
import { EmbeddedChat } from "@/components/EmbeddedChat";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export default async function WatchPage({
    params,
}: {
    params: { id: string };
}) {
    const supabase = await createClient();
    const { data: video, error } = await supabase
        .from("videos")
        .select("*, channels(*)")
        .eq("id", params.id)
        .single();

    // Mock data fallback if database connection defaults
    const mockVideo = {
        id: params.id,
        title: "Building a YouTube Clone with Next.js and Whop API",
        video_url: "https://www.w3schools.com/html/mov_bbb.mp4", // Sample public video
        views: 120542,
        created_at: new Date().toISOString(),
        channels: {
            channel_name: "Whop Devs",
            avatar_url: "https://github.com/whop.png",
            whop_chat_channel_id: "channel_123456", // Mock chat ID
        }
    };

    const v = video || mockVideo;

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Column: Video & Info */}
            <div className="flex-1 min-w-0">
                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-[#303030]">
                    <video
                        src={v.video_url}
                        controls
                        className="w-full h-full object-contain"
                        poster="https://images.unsplash.com/photo-1627398225058-eb1da594ce2e?auto=format&fit=crop&q=80&w=1000"
                    />
                </div>

                <h1 className="text-xl font-bold text-white mt-4">{v.title}</h1>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-3 gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={`/channel/${v.channels.channel_name}`} className="flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={v.channels.avatar_url || "/placeholder-avatar.jpg"}
                                alt={v.channels.channel_name}
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        </Link>
                        <div>
                            <Link href={`/channel/${v.channels.channel_name}`}>
                                <h3 className="font-semibold text-white whitespace-nowrap">{v.channels.channel_name}</h3>
                            </Link>
                            <p className="text-xs text-gray-400">125K subscribers</p>
                        </div>
                        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 font-medium rounded-full ml-2 transition-colors">
                            Subscribe
                        </button>
                        <button className="bg-[#272727] hover:bg-[#3f3f3f] text-white px-4 py-2 font-medium rounded-full transition-colors hidden sm:block">
                            Join
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-medium">
                        <div className="flex items-center bg-[#272727] rounded-full overflow-hidden">
                            <button className="flex items-center gap-2 px-4 py-2 hover:bg-[#3f3f3f] transition-colors border-r border-[#3f3f3f]">
                                <ThumbsUp className="w-5 h-5" /> 12K
                            </button>
                            <button className="flex items-center px-4 py-2 hover:bg-[#3f3f3f] transition-colors">
                                <ThumbsDown className="w-5 h-5" />
                            </button>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-[#272727] hover:bg-[#3f3f3f] rounded-full transition-colors hidden sm:flex">
                            <Share2 className="w-5 h-5" /> Share
                        </button>
                        <button className="p-2 bg-[#272727] hover:bg-[#3f3f3f] rounded-full transition-colors hidden sm:block">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="mt-4 p-4 bg-[#232323] hover:bg-[#272727] transition-colors rounded-xl text-sm text-gray-200">
                    <div className="font-medium text-white mb-1">
                        {v.views.toLocaleString()} views • {new Date(v.created_at).toLocaleDateString()}
                    </div>
                    <p className="line-clamp-2">
                        Welcome to this video! Today we are exploring the seamless integration of Next.js with Supabase and the Whop API SDK. Make sure to like and subscribe for more content!
                    </p>
                </div>
            </div>

            {/* Right Column: Embedded Chat & Recommendations */}
            <div className="w-full lg:w-[400px] flex flex-col gap-6">
                {/* Whop Embedded Chat Container */}
                {v.channels.whop_chat_channel_id ? (
                    <div className="h-[500px]">
                        <EmbeddedChat channelId={v.channels.whop_chat_channel_id} />
                    </div>
                ) : (
                    <div className="h-[200px] flex flex-col items-center justify-center bg-[#1F1F1F] rounded-xl border border-[#303030] text-gray-400 p-6 text-center">
                        <p>Chat is disabled for this stream</p>
                    </div>
                )}
            </div>
        </div>
    );
}
