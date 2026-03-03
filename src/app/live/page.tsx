import { LiveBadge } from "@/components/LiveBadge";
import { Users, Radio, Calendar, Clock } from "lucide-react";
import Link from "next/link";

// Mock streams (in production, these would come from Supabase or a streaming service)
const LIVE_STREAMS = [
    {
        id: "stream-1",
        title: "Building a SaaS App Live! - Day 12",
        creator: "DevMaster",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
        thumbnail: "https://images.unsplash.com/photo-1627398225058-eb1da594ce2e?auto=format&fit=crop&q=80&w=800",
        viewers: 2340,
        isLive: true,
        category: "Programming",
    },
    {
        id: "stream-2",
        title: "Music Production Session - Lo-fi Beats",
        creator: "BeatLab",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
        thumbnail: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=800",
        viewers: 890,
        isLive: true,
        category: "Music",
    },
    {
        id: "stream-3",
        title: "Crypto Market Analysis & Trading",
        creator: "CryptoKing",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100",
        thumbnail: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800",
        viewers: 5120,
        isLive: true,
        category: "Finance",
    },
];

const UPCOMING_STREAMS = [
    {
        id: "upcoming-1",
        title: "React 19 Deep Dive - What's New?",
        creator: "TechExplorer",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
        thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800",
        scheduledFor: "Tomorrow at 3:00 PM",
        category: "Programming",
    },
    {
        id: "upcoming-2",
        title: "Fitness Q&A - Ask Me Anything",
        creator: "FitCoach",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100",
        thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800",
        scheduledFor: "Friday at 6:00 PM",
        category: "Fitness",
    },
];

function formatViewers(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
}

export default function LivePage() {
    return (
        <div className="space-y-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center">
                    <Radio className="w-6 h-6 text-red-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold">Live</h1>
                    <p className="text-gray-400 text-sm">Watch creators stream live right now</p>
                </div>
            </div>

            {/* Live Now */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-bold">Live Now</h2>
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {LIVE_STREAMS.map((stream) => (
                        <Link
                            key={stream.id}
                            href={`/live/${stream.id}`}
                            className="group rounded-xl overflow-hidden bg-[#1A1A1A] hover:bg-[#222222] transition-colors border border-[#272727] hover:border-[#3f3f3f]"
                        >
                            <div className="relative aspect-video overflow-hidden">
                                <img
                                    src={stream.thumbnail}
                                    alt={stream.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-3 left-3">
                                    <LiveBadge size="md" />
                                </div>
                                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {formatViewers(stream.viewers)} watching
                                </div>
                                {/* Red bottom border pulse */}
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-600" />
                            </div>
                            <div className="p-4">
                                <div className="flex gap-3">
                                    <img
                                        src={stream.avatar}
                                        alt={stream.creator}
                                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1">{stream.title}</h3>
                                        <p className="text-xs text-gray-400">{stream.creator}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{stream.category}</p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Upcoming */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <h2 className="text-xl font-bold">Upcoming</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {UPCOMING_STREAMS.map((stream) => (
                        <div
                            key={stream.id}
                            className="flex gap-4 p-4 bg-[#1A1A1A] rounded-xl border border-[#272727] hover:border-[#3f3f3f] transition-colors"
                        >
                            <div className="relative w-48 aspect-video rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                    src={stream.thumbnail}
                                    alt={stream.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                    <Clock className="w-8 h-8 text-white/70" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                                <h3 className="font-semibold text-sm line-clamp-2">{stream.title}</h3>
                                <div className="flex items-center gap-2">
                                    <img src={stream.avatar} alt="" className="w-6 h-6 rounded-full" />
                                    <span className="text-xs text-gray-400">{stream.creator}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-blue-400">
                                    <Calendar className="w-3 h-3" />
                                    {stream.scheduledFor}
                                </div>
                                <button className="text-xs bg-[#272727] hover:bg-[#3f3f3f] px-3 py-1.5 rounded-full transition-colors font-medium">
                                    Set Reminder
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
