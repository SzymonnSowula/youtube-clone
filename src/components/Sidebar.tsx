import Link from "next/link";
import { Home, Compass, PlaySquare, Clock, ThumbsUp, History, LayoutDashboard, DollarSign, Film, Users } from "lucide-react";

interface SidebarProps {
    user?: {
        username?: string;
        avatar_url?: string;
    } | null;
}

export function Sidebar({ user }: SidebarProps) {
    return (
        <aside className="fixed left-0 top-16 w-60 h-[calc(100vh-4rem)] bg-[#0F0F0F] overflow-y-auto hidden md:block z-40">
            <div className="flex flex-col py-3">
                <SidebarItem href="/" icon={<Home className="w-5 h-5" />} label="Home" active />
                <SidebarItem href="#" icon={<Compass className="w-5 h-5" />} label="Explore" />
                <SidebarItem href="#" icon={<PlaySquare className="w-5 h-5" />} label="Shorts" />
                <SidebarItem href="#" icon={<Users className="w-5 h-5" />} label="Subscriptions" />
            </div>

            <div className="border-t border-[#303030] my-2" />

            {user ? (
                <>
                    <div className="flex flex-col py-2">
                        <h3 className="px-5 py-2 text-sm font-semibold text-white">You</h3>
                        <SidebarItem href="#" icon={<History className="w-5 h-5" />} label="History" />
                        <SidebarItem href="#" icon={<Clock className="w-5 h-5" />} label="Watch Later" />
                        <SidebarItem href="#" icon={<ThumbsUp className="w-5 h-5" />} label="Liked Videos" />
                    </div>

                    <div className="border-t border-[#303030] my-2" />

                    <div className="flex flex-col py-2">
                        <h3 className="px-5 py-2 text-sm font-semibold text-white">Creator Studio</h3>
                        <SidebarItem href="/creator/dashboard" icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" />
                        <SidebarItem href="/creator/content" icon={<Film className="w-5 h-5" />} label="Content" />
                        <SidebarItem href="/creator/payouts" icon={<DollarSign className="w-5 h-5" />} label="Payouts" />
                    </div>
                </>
            ) : (
                <>
                    <div className="flex flex-col py-2">
                        <h3 className="px-5 py-2 text-sm font-semibold text-white">Library</h3>
                        <SidebarItem href="#" icon={<History className="w-5 h-5" />} label="History" />
                        <SidebarItem href="#" icon={<Clock className="w-5 h-5" />} label="Watch Later" />
                        <SidebarItem href="#" icon={<ThumbsUp className="w-5 h-5" />} label="Liked Videos" />
                    </div>

                    <div className="border-t border-[#303030] my-2" />

                    <div className="px-5 py-4 text-xs text-[#AAAAAA] space-y-3">
                        <p>Sign in to like videos, comment, and subscribe.</p>
                        <Link href="/api/auth/login" className="inline-flex items-center gap-2 border border-[#3f3f3f] px-4 py-1.5 rounded-full text-blue-400 hover:bg-[#263850] transition-colors font-medium">
                            <UserIcon /> Sign In
                        </Link>
                    </div>
                </>
            )}
        </aside>
    );
}

function SidebarItem({ href, icon, label, active = false }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-5 px-5 py-2.5 hover:bg-[#272727] transition-colors ${active ? "bg-[#272727] text-white" : "text-[#AAAAAA]"}`}
        >
            {icon}
            <span className="text-[14px] font-medium">{label}</span>
        </Link>
    );
}

function UserIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"></path>
        </svg>
    );
}
