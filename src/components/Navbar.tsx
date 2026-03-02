import Link from "next/link";
import { Search, Menu, Video, Bell, User, LogOut, LayoutDashboard } from "lucide-react";

interface NavbarProps {
    user?: {
        username?: string;
        avatar_url?: string;
        email?: string;
    } | null;
}

export function Navbar({ user }: NavbarProps) {
    return (
        <nav className="fixed top-0 w-full h-16 bg-[#0F0F0F] flex items-center justify-between px-4 z-50 border-b border-[#272727]">
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
                {user ? (
                    <>
                        <Link href="/creator/dashboard" className="p-2 hover:bg-[#272727] rounded-full hidden sm:block" title="Creator Studio">
                            <Video className="w-6 h-6 text-white" />
                        </Link>
                        <button className="p-2 hover:bg-[#272727] rounded-full hidden sm:block">
                            <Bell className="w-6 h-6 text-white" />
                        </button>

                        <div className="relative group ml-2">
                            <button className="flex items-center">
                                {user.avatar_url ? (
                                    <img
                                        src={user.avatar_url}
                                        alt={user.username || "Profile"}
                                        className="w-8 h-8 rounded-full object-cover border-2 border-transparent hover:border-blue-500 transition-colors"
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                                        {(user.username || user.email || "U").charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            <div className="absolute right-0 top-full mt-2 w-72 bg-[#282828] rounded-xl shadow-2xl border border-[#3f3f3f] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                <div className="p-4 border-b border-[#3f3f3f]">
                                    <div className="flex items-center gap-3">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-lg font-bold">
                                                {(user.username || "U").charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold text-white">{user.username || "User"}</p>
                                            <p className="text-xs text-gray-400">{user.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="py-2">
                                    <Link href="/creator/dashboard" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#3f3f3f] transition-colors">
                                        <LayoutDashboard className="w-5 h-5" />
                                        Creator Studio
                                    </Link>
                                    <Link href="/api/auth/logout" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-[#3f3f3f] transition-colors">
                                        <LogOut className="w-5 h-5" />
                                        Sign out
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <Link href="/api/auth/login" className="ml-2 flex items-center gap-2 bg-[#272727] hover:bg-[#3f3f3f] px-4 py-1.5 rounded-full transition-colors border border-[#3f3f3f]">
                        <User className="w-5 h-5 text-blue-400" />
                        <span className="text-sm font-medium text-blue-400">Sign In</span>
                    </Link>
                )}
            </div>
        </nav>
    );
}
