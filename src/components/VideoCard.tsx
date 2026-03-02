import Link from "next/link";
import { CheckCircle } from "lucide-react";

interface VideoCardProps {
    id: string;
    title: string;
    thumbnailUrl: string;
    channelName: string;
    views: string;
    postedAt: string;
    channelAvatarUrl: string;
    isWhopConnected?: boolean;
}

export function VideoCard({
    id,
    title,
    thumbnailUrl,
    channelName,
    views,
    postedAt,
    channelAvatarUrl,
    isWhopConnected,
}: VideoCardProps) {
    return (
        <div className="flex flex-col gap-2 group cursor-pointer w-full max-w-sm">
            <Link href={`/watch/${id}`}>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-[#272727]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={thumbnailUrl || "/placeholder-video.jpg"}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                        10:24
                    </div>
                </div>
            </Link>

            <div className="flex gap-3 mt-1">
                <Link href={`/channel/${channelName}`} className="flex-shrink-0 mt-0.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={channelAvatarUrl || "/placeholder-avatar.jpg"}
                        alt={channelName}
                        className="w-9 h-9 rounded-full object-cover"
                    />
                </Link>
                <div className="flex flex-col">
                    <Link href={`/watch/${id}`}>
                        <h3 className="text-white text-sm font-semibold line-clamp-2 leading-tight group-hover:text-blue-400">
                            {title}
                        </h3>
                    </Link>
                    <Link href={`/channel/${channelName}`} className="text-[#AAAAAA] text-[13px] hover:text-white mt-1 flex items-center gap-1">
                        {channelName}
                        {isWhopConnected && <CheckCircle className="w-3.5 h-3.5 text-[#AAAAAA]" />}
                    </Link>
                    <div className="text-[#AAAAAA] text-[13px] flex items-center gap-1">
                        <span>{views} views</span>
                        <span className="text-[10px]">•</span>
                        <span>{postedAt}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
