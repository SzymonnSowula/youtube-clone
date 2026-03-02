import { VideoCard } from "@/components/VideoCard";

// Mock data until Supabase is connected and populated
const MOCK_VIDEOS = [
  {
    id: "1",
    title: "Building a YouTube Clone with Next.js and Whop API",
    thumbnailUrl: "https://images.unsplash.com/photo-1627398225058-eb1da594ce2e?auto=format&fit=crop&q=80&w=1000",
    channelName: "Whop Devs",
    views: "120K",
    postedAt: "2 days ago",
    channelAvatarUrl: "https://github.com/whop.png",
    isWhopConnected: true,
  },
  {
    id: "2",
    title: "How to monetize your audience in 2024",
    thumbnailUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000",
    channelName: "Creator Economy",
    views: "500K",
    postedAt: "1 week ago",
    channelAvatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
    isWhopConnected: false,
  },
  {
    id: "3",
    title: "The secret to 1M subscribers",
    thumbnailUrl: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=1000",
    channelName: "Growth Hacks",
    views: "1.2M",
    postedAt: "3 weeks ago",
    channelAvatarUrl: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=100",
    isWhopConnected: true,
  },
  {
    id: "4",
    title: "Why I switched to Whop for my community",
    thumbnailUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000",
    channelName: "Design Better",
    views: "85K",
    postedAt: "5 hours ago",
    channelAvatarUrl: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100",
  }
];

export default function Home() {
  return (
    <div className="w-full">
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {["All", "Web Development", "Next.js", "Music", "React", "Live", "Gaming", "News", "Podcasts", "Recently uploaded"].map((tag) => (
          <button
            key={tag}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tag === "All"
                ? "bg-white text-black"
                : "bg-[#272727] text-white hover:bg-[#3f3f3f]"
              }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-10">
        {MOCK_VIDEOS.map((video) => (
          <VideoCard key={video.id} {...video} />
        ))}
        {MOCK_VIDEOS.map((video) => (
          <VideoCard key={video.id + "-copy"} {...video} />
        ))}
      </div>
    </div>
  );
}
