import { LiveBadge } from "@/components/LiveBadge";
import { EmbeddedChat } from "@/components/EmbeddedChat";
import { Users, Heart, Share2, Flag, DollarSign } from "lucide-react";
import Link from "next/link";

// Mock stream data
const STREAMS: Record<string, any> = {
    "stream-1": {
        title: "Building a SaaS App Live! - Day 12",
        creator: "DevMaster",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
        viewers: 2340,
        category: "Programming",
        description: "Day 12 of building a SaaS app from scratch! Today we're implementing the payment system using the Whop SDK. Come ask questions!",
        streamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
        chatChannelId: "",
    },
    "stream-2": {
        title: "Music Production Session - Lo-fi Beats",
        creator: "BeatLab",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
        viewers: 890,
        category: "Music",
        description: "Making lo-fi beats live. Drop your requests in chat!",
        streamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
        chatChannelId: "",
    },
    "stream-3": {
        title: "Crypto Market Analysis & Trading",
        creator: "CryptoKing",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100",
        viewers: 5120,
        category: "Finance",
        description: "Live crypto market analysis. We're watching BTC and ETH levels closely today.",
        streamUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1",
        chatChannelId: "",
    },
};

function formatViewers(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
}

export default function LiveStreamPage({ params }: { params: { id: string } }) {
    const stream = STREAMS[params.id];

    if (!stream) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-4">
                    <h2 className="text-2xl font-bold">Stream not found</h2>
                    <p className="text-gray-400">This stream may have ended or doesn't exist.</p>
                    <Link href="/live" className="inline-block bg-white text-black px-6 py-2 rounded-full font-medium text-sm hover:bg-gray-200 transition-colors">
                        Browse Live Streams
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-4">
            {/* Stream Player + Info */}
            <div className="flex-1 space-y-4">
                {/* Video Player */}
                <div className="aspect-video w-full bg-black rounded-xl overflow-hidden relative">
                    <iframe
                        src={stream.streamUrl}
                        className="w-full h-full"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                    />
                    {/* Live overlay */}
                    <div className="absolute top-4 left-4 flex items-center gap-3">
                        <LiveBadge size="lg" />
                        <div className="bg-black/70 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            {formatViewers(stream.viewers)} watching
                        </div>
                    </div>
                </div>

                {/* Stream Info */}
                <div className="space-y-4">
                    <h1 className="text-xl font-bold">{stream.title}</h1>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <img src={stream.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                            <div>
                                <h3 className="font-bold text-base">{stream.creator}</h3>
                                <p className="text-xs text-gray-400">{stream.category}</p>
                            </div>
                            <button className="ml-4 bg-white text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors">
                                Subscribe
                            </button>
                        </div>

                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 px-4 h-9 bg-[#272727] rounded-full hover:bg-[#3f3f3f] transition-colors">
                                <Heart className="w-4 h-4" />
                                <span className="text-sm font-bold">Like</span>
                            </button>
                            <button className="flex items-center gap-2 px-4 h-9 bg-[#272727] rounded-full hover:bg-[#3f3f3f] transition-colors">
                                <Share2 className="w-4 h-4" />
                                <span className="text-sm font-bold">Share</span>
                            </button>
                            <button className="flex items-center gap-2 px-4 h-9 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full hover:opacity-90 transition-opacity">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-sm font-bold">Super Chat</span>
                            </button>
                            <button className="flex items-center justify-center w-9 h-9 bg-[#272727] rounded-full hover:bg-[#3f3f3f] transition-colors">
                                <Flag className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#272727] rounded-xl p-4 text-sm">
                        <p className="whitespace-pre-wrap text-gray-300">{stream.description}</p>
                    </div>
                </div>
            </div>

            {/* Chat Sidebar */}
            <div className="w-full lg:w-[350px] xl:w-[400px] flex-shrink-0">
                <div className="sticky top-20 h-[calc(100vh-6rem)]">
                    <div className="bg-[#1A1A1A] rounded-xl border border-[#272727] h-full flex flex-col overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#272727] flex items-center justify-between">
                            <h3 className="font-bold text-sm">Live Chat</h3>
                            <LiveBadge size="sm" />
                        </div>
                        <div className="flex-1">
                            {stream.chatChannelId ? (
                                <EmbeddedChat channelId={stream.chatChannelId} />
                            ) : (
                                <div className="h-full flex flex-col">
                                    {/* Mock chat messages */}
                                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                        <ChatMessage user="TechFan42" message="Amazing stream! Keep it up 🔥" time="2m ago" />
                                        <ChatMessage user="NewbieDev" message="How do you handle auth in this?" time="1m ago" />
                                        <ChatMessage user="ProCoder" message="The Whop SDK makes payment integration so clean" time="45s ago" />
                                        <ChatMessage user="StudyWithMe" message="This is exactly what I needed to learn!" time="30s ago" />
                                        <ChatMessage user="DevMaster" message="Thanks everyone! Let me show you the checkout flow next" time="15s ago" isCreator />
                                        <ChatMessage user="ReactLover" message="Can you explain the PKCE flow again?" time="10s ago" />
                                        <ChatMessage user="FullStack99" message="First time here, this is great content 👏" time="5s ago" />
                                    </div>
                                    <div className="p-3 border-t border-[#272727]">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Send a message..."
                                                className="flex-1 bg-[#272727] px-3 py-2 rounded-full text-sm outline-none focus:ring-1 focus:ring-blue-500 text-white placeholder-gray-500"
                                            />
                                            <button className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-600 transition-colors">
                                                Chat
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChatMessage({ user, message, time, isCreator = false }: { user: string; message: string; time: string; isCreator?: boolean }) {
    return (
        <div className="flex gap-2 text-sm">
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold ${isCreator ? "bg-red-600" : "bg-[#303030]"}`}>
                {user.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
                <span className={`font-medium text-xs mr-1 ${isCreator ? "text-red-400" : "text-gray-400"}`}>
                    {user}
                    {isCreator && <span className="ml-1 text-[10px] bg-red-600/20 text-red-400 px-1 rounded">Creator</span>}
                </span>
                <span className="text-gray-200 break-words">{message}</span>
                <span className="text-[10px] text-gray-600 ml-1">{time}</span>
            </div>
        </div>
    );
}
