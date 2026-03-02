"use client";

import { useState } from "react";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";

export default function PayoutButton() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpenPayouts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/creator/payouts", { method: "POST" });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || "Failed to open payout portal");

            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleOpenPayouts}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 w-full max-w-sm px-6 py-3 bg-[#FF7043] text-white rounded-lg font-medium hover:bg-[#FF855D] transition-colors disabled:opacity-50"
            >
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <>
                        <CreditCard className="w-5 h-5" />
                        Open Whop Payouts Portal
                        <ExternalLink className="w-4 h-4 ml-2" />
                    </>
                )}
            </button>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
    );
}
