import Link from "next/link";
import { LayoutDashboard, Users, CreditCard, PlaySquare, Settings, DollarSign, BarChart3 } from "lucide-react";

export function CreatorSidebar() {
    return (
        <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-[#1F1F1F] border-r border-[#303030] overflow-y-auto hidden md:block z-40">
            <div className="flex flex-col items-center py-6 border-b border-[#303030]">
                <div className="w-20 h-20 rounded-full bg-blue-500 mb-3 border-2 border-white/10" />
                <h2 className="font-semibold text-white">Your Channel</h2>
                <p className="text-sm text-gray-400">@creator</p>
            </div>

            <div className="flex flex-col py-4">
                <SidebarItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboard" href="/creator/dashboard" />
                <SidebarItem icon={<PlaySquare className="w-5 h-5" />} label="Content" href="/creator/content" />
                <SidebarItem icon={<BarChart3 className="w-5 h-5 text-green-400" />} label="Revenue" href="/creator/revenue" />
                <SidebarItem icon={<Users className="w-5 h-5" />} label="Community" />
                <SidebarItem icon={<DollarSign className="w-5 h-5 text-green-400" />} label="Memberships" href="/creator/memberships" />
                <SidebarItem icon={<CreditCard className="w-5 h-5 text-blue-400" />} label="Payouts" href="/creator/payouts" />
            </div>

            <div className="absolute bottom-0 w-full p-4 border-t border-[#303030]">
                <SidebarItem icon={<Settings className="w-5 h-5" />} label="Settings" />
            </div>
        </aside>
    );
}

function SidebarItem({ icon, label, active = false, href = "#" }: { icon: React.ReactNode, label: string, active?: boolean, href?: string }) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-4 px-6 py-3 hover:bg-[#303030] transition-colors ${active ? "bg-[#303030] text-blue-400 border-l-4 border-blue-400" : "text-gray-300 border-l-4 border-transparent"}`}
        >
            {icon}
            <span className="text-[14px] font-medium">{label}</span>
        </Link>
    );
}
