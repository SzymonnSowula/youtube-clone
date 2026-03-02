import Link from "next/link";
import { Search, Menu, Video, Bell, User } from "lucide-react";

export function Navbar() {
    return (
        <nav className="fixed top-0 w-full h-16 bg-[#0F0F0F] flex items-center justify-between px-4 z-50">
            <div className="flex items-center gap-4">
                <button className="p-2 hover:bg-[#272727] rounded-full">
                    <Menu className="w-6 h-6 text-white" />
                </button>
                <Link href="/" className="flex items-center gap-1">
                    <div className="w-8 h-6 bg-red-600 rounded-lg flex items-center justify-center">
                        <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-0.5"></div>
                    </div>
                    <span className="text-xl font-bold tracking-tighter text-white">WhopTube</span>
                </Link>
            </div>

            <div className="flex-1 max-w-2xl px-12 flex items-center">
                <div className="flex w-full items-center">
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-[#121212] border border-[#303030] rounded-l-full px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                    <button className="bg-[#222222] border border-l-0 border-[#303030] rounded-r-full px-5 py-2 hover:bg-[#303030] transition-colors">
                        <Search className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-[#272727] rounded-full hidden sm:block">
                    <Video className="w-6 h-6 text-white" />
                </button>
                <button className="p-2 hover:bg-[#272727] rounded-full hidden sm:block">
                    <Bell className="w-6 h-6 text-white" />
                </button>

                {/* Whop Auth Button Placeholder */}
                <Link href="/api/auth/login" className="ml-2 flex items-center gap-2 bg-[#272727] hover:bg-[#3f3f3f] px-4 py-1.5 rounded-full transition-colors border border-[#3f3f3f]">
                    <User className="w-5 h-5 text-white" />
                    <span className="text-sm font-medium text-white">Sign In</span>
                </Link>
            </div>
        </nav>
    );
}
