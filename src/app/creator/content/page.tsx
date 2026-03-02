import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CreatorSidebar } from "@/components/CreatorSidebar";
import { PlayCircle, MoreVertical, Globe, Lock, Eye, MessageSquare, ThumbsUp } from "lucide-react";

export default async function ContentPage() {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/api/auth/login");
    }

    // Fetch channel videos
    const { data: videos } = await supabase
        .from("videos")
        .select("*")
        .eq("channel_id", user.id)
        .order("created_at", { ascending: false });

    return (
        <div className="flex h-screen bg-[#0F0F0F] text-white">
            <CreatorSidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold">Channel content</h1>
                        <button className="bg-white text-black px-4 py-2 rounded-full font-medium text-sm hover:bg-gray-200 transition-colors">
                            Upload Video
                        </button>
                    </div>

                    <div className="flex gap-8 border-b border-[#303030] mb-6">
                        {["Videos", "Live", "Playlists"].map((tab) => (
                            <button
                                key={tab}
                                className={`pb-3 text-sm font-bold border-b-2 transition-colors ${tab === "Videos" ? "border-white text-white" : "border-transparent text-gray-400 hover:text-white"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="bg-[#1F1F1F] rounded-2xl border border-[#303030] overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="border-b border-[#303030] bg-[#1a1a1a]">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Video</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Visibility</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Stats</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#303030]">
                                {!videos || videos.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-4 text-gray-400">
                                                <PlayCircle className="w-12 h-12 opacity-20" />
                                                <p>No videos found. Upload your first video to get started!</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    videos.map((video) => (
                                        <tr key={video.id} className="hover:bg-[#272727] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex gap-4 items-center">
                                                    <div className="w-32 aspect-video bg-[#272727] rounded-lg overflow-hidden flex-shrink-0">
                                                        <img src={video.thumbnail_url} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-medium text-sm line-clamp-2">{video.title}</p>
                                                        <p className="text-xs text-gray-500 line-clamp-1">{video.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {video.is_gated ? (
                                                        <>
                                                            <Lock className="w-4 h-4 text-orange-500" />
                                                            <span className="text-orange-500 text-sm font-medium">Members Only</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Globe className="w-4 h-4 text-green-500" />
                                                            <span className="text-green-500 text-sm font-medium">Public</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400">
                                                {new Date(video.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end gap-6 text-gray-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <Eye className="w-4 h-4" />
                                                        <span className="text-xs">{video.views}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <MessageSquare className="w-4 h-4" />
                                                        <span className="text-xs">24</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <ThumbsUp className="w-4 h-4" />
                                                        <span className="text-xs">1.2K</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-[#3f3f3f]">
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
