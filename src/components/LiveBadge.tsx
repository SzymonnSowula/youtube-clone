export function LiveBadge({ size = "sm" }: { size?: "sm" | "md" | "lg" }) {
    const sizeClasses = {
        sm: "text-[10px] px-1.5 py-0.5",
        md: "text-xs px-2 py-0.5",
        lg: "text-sm px-3 py-1",
    }

    return (
        <span className={`bg-red-600 text-white font-bold rounded ${sizeClasses[size]} inline-flex items-center gap-1 uppercase tracking-wide`}>
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Live
        </span>
    )
}
