import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { CreatorSidebar } from "@/components/CreatorSidebar";
import { getSession } from "@/lib/auth";
import { whop } from "@/lib/whop";
import { DollarSign, TrendingUp, Receipt, ArrowDownRight, CreditCard, ExternalLink } from "lucide-react";
import Link from "next/link";

interface PaymentItem {
    id: string;
    amount: number;
    currency: string | null;
    status: string | null;
    substatus: string;
    billing_reason: string | null;
    card_brand: string | null;
    card_last4: string | null;
    payment_method_type: string | null;
    user: { id: string; name: string | null; email: string | null; username: string } | null;
    product: { id: string; title: string } | null;
    refundable: boolean;
    refunded_amount: number | null;
    refunded_at: string | null;
    paid_at: string | null;
    created_at: string;
}

export default async function RevenuePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const session = await getSession();

    if (!session.isLoggedIn || !session.userId) {
        redirect("/api/auth/login");
    }

    const supabase = await createClient();

    const { data: channel } = await supabase
        .from("channels")
        .select("*")
        .eq("id", session.userId)
        .single();

    if (!channel) {
        redirect("/creator/onboarding");
    }

    const params = await searchParams;
    const filterReason = params.filter || "all";

    let payments: PaymentItem[] = [];
    let totalRevenue = 0;
    let totalPayments = 0;
    let refundedAmount = 0;
    let avgPayment = 0;

    // Daily revenue for chart (last 30 days)
    const dailyRevenue: { date: string; amount: number }[] = [];
    const now = new Date();

    // Initialize last 30 days
    for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dailyRevenue.push({
            date: d.toISOString().split("T")[0],
            amount: 0,
        });
    }

    if (channel.whop_company_id) {
        try {
            const listParams: Record<string, unknown> = {
                company_id: channel.whop_company_id,
                first: 100,
                order: "created_at" as const,
                direction: "desc" as const,
            };

            if (filterReason && filterReason !== "all") {
                listParams.billing_reasons = [filterReason];
            }

            const paymentsPage = await whop.payments.list(
                listParams as Parameters<typeof whop.payments.list>[0]
            );

            for await (const p of paymentsPage) {
                const amount = (p as any).usd_total ?? (p as any).total ?? 0;
                const payment: PaymentItem = {
                    id: p.id,
                    amount,
                    currency: (p as any).currency || "usd",
                    status: (p as any).status,
                    substatus: (p as any).substatus,
                    billing_reason: (p as any).billing_reason,
                    card_brand: (p as any).card_brand,
                    card_last4: (p as any).card_last4,
                    payment_method_type: (p as any).payment_method_type,
                    user: (p as any).user
                        ? {
                            id: (p as any).user.id,
                            name: (p as any).user.name,
                            email: (p as any).user.email,
                            username: (p as any).user.username,
                        }
                        : null,
                    product: (p as any).product
                        ? { id: (p as any).product.id, title: (p as any).product.title }
                        : null,
                    refundable: (p as any).refundable,
                    refunded_amount: (p as any).refunded_amount,
                    refunded_at: (p as any).refunded_at,
                    paid_at: (p as any).paid_at,
                    created_at: (p as any).created_at,
                };

                payments.push(payment);

                if ((p as any).status === "paid") {
                    totalRevenue += amount;
                    totalPayments++;

                    // Add to daily chart if within last 30 days
                    const paidDate = (payment.paid_at || payment.created_at || "").split("T")[0];
                    const dayEntry = dailyRevenue.find((d) => d.date === paidDate);
                    if (dayEntry) {
                        dayEntry.amount += amount;
                    }
                }

                refundedAmount += (p as any).refunded_amount || 0;

                if (payments.length >= 100) break;
            }

            avgPayment = totalPayments > 0 ? totalRevenue / totalPayments : 0;
        } catch (err) {
            console.error("[Revenue] Whop error:", err);
        }
    }

    const maxDailyRevenue = Math.max(...dailyRevenue.map((d) => d.amount), 1);

    function getStatusBadge(status: string | null, substatus: string) {
        const label = substatus || status || "pending";
        switch (status) {
            case "paid":
                return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-400/10 text-green-400">${label}</span>`;
            case "failed":
                return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-400/10 text-red-400">${label}</span>`;
            case "refunded":
                return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-400/10 text-yellow-400">${label}</span>`;
            default:
                return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-400/10 text-gray-400">${label}</span>`;
        }
    }

    function formatBillingReason(reason: string | null): string {
        switch (reason) {
            case "subscription_create":
                return "New Sub";
            case "subscription_cycle":
                return "Renewal";
            case "subscription_update":
                return "Update";
            case "one_time":
                return "One-time";
            case "manual":
                return "Manual";
            default:
                return reason || "—";
        }
    }

    function statusColor(status: string | null): string {
        switch (status) {
            case "paid":
                return "text-green-400 bg-green-400/10";
            case "failed":
                return "text-red-400 bg-red-400/10";
            case "refunded":
                return "text-yellow-400 bg-yellow-400/10";
            default:
                return "text-gray-400 bg-gray-400/10";
        }
    }

    const stats = [
        { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-green-400", bg: "bg-green-400/10" },
        { label: "Payments", value: totalPayments.toString(), icon: Receipt, color: "text-blue-400", bg: "bg-blue-400/10" },
        { label: "Avg Payment", value: `$${avgPayment.toFixed(2)}`, icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-400/10" },
        { label: "Refunded", value: `$${refundedAmount.toFixed(2)}`, icon: ArrowDownRight, color: "text-red-400", bg: "bg-red-400/10" },
    ];

    const filterOptions = [
        { value: "all", label: "All Payments" },
        { value: "subscription_create", label: "New Subscriptions" },
        { value: "subscription_cycle", label: "Renewals" },
        { value: "one_time", label: "One-time" },
        { value: "manual", label: "Manual" },
    ];

    return (
        <div className="flex h-screen bg-[#0F0F0F] text-white">
            <CreatorSidebar />
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">Revenue</h1>
                            <p className="text-gray-400 mt-1">
                                Real payment data from Whop • {channel.channel_name}
                            </p>
                        </div>
                        <Link
                            href="/creator/payouts"
                            className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full font-medium text-sm hover:bg-gray-200 transition-colors"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Payout Portal
                        </Link>
                    </div>

                    {!channel.whop_company_id ? (
                        <div className="p-12 border-2 border-dashed border-[#303030] rounded-3xl text-center">
                            <DollarSign className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">No Whop company connected</h3>
                            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                                Connect your Whop company to see real-time revenue data, payment
                                history, and analytics.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {stats.map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="p-5 bg-[#1F1F1F] border border-[#303030] rounded-2xl hover:border-[#404040] transition-colors"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                            </div>
                                        </div>
                                        <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                                        <h3 className="text-2xl font-bold">{stat.value}</h3>
                                    </div>
                                ))}
                            </div>

                            {/* Revenue Chart */}
                            <div className="p-6 bg-[#1F1F1F] border border-[#303030] rounded-2xl mb-8">
                                <h2 className="text-lg font-bold mb-1">Revenue (Last 30 Days)</h2>
                                <p className="text-sm text-gray-500 mb-6">Daily revenue in USD</p>
                                <div className="flex items-end gap-[2px] h-40">
                                    {dailyRevenue.map((day) => {
                                        const heightPercent =
                                            maxDailyRevenue > 0
                                                ? (day.amount / maxDailyRevenue) * 100
                                                : 0;
                                        return (
                                            <div
                                                key={day.date}
                                                className="flex-1 group relative"
                                                title={`${day.date}: $${day.amount.toFixed(2)}`}
                                            >
                                                <div
                                                    className="w-full rounded-t-sm bg-green-500/60 hover:bg-green-400 transition-colors cursor-pointer"
                                                    style={{
                                                        height: `${Math.max(heightPercent, 2)}%`,
                                                        minHeight: "2px",
                                                    }}
                                                />
                                                {/* Tooltip */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                    <div className="bg-[#303030] text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                                        ${day.amount.toFixed(2)}
                                                        <br />
                                                        <span className="text-gray-400">
                                                            {new Date(day.date).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-gray-600">
                                    <span>
                                        {new Date(dailyRevenue[0]?.date).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </span>
                                    <span>
                                        {new Date(
                                            dailyRevenue[dailyRevenue.length - 1]?.date
                                        ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Filters + Transaction Table */}
                            <div className="p-6 bg-[#1F1F1F] border border-[#303030] rounded-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-bold">Transactions</h2>
                                    <div className="flex gap-2">
                                        {filterOptions.map((opt) => (
                                            <Link
                                                key={opt.value}
                                                href={`/creator/revenue${opt.value !== "all" ? `?filter=${opt.value}` : ""}`}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterReason === opt.value
                                                        ? "bg-white text-black"
                                                        : "bg-[#272727] text-gray-300 hover:bg-[#3f3f3f]"
                                                    }`}
                                            >
                                                {opt.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>

                                {payments.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-[#303030]">
                                                    <th className="text-left py-3 px-3 font-medium">Date</th>
                                                    <th className="text-left py-3 px-3 font-medium">Customer</th>
                                                    <th className="text-left py-3 px-3 font-medium">Amount</th>
                                                    <th className="text-left py-3 px-3 font-medium">Status</th>
                                                    <th className="text-left py-3 px-3 font-medium">Type</th>
                                                    <th className="text-left py-3 px-3 font-medium">Method</th>
                                                    <th className="text-left py-3 px-3 font-medium">Refund</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {payments.map((p) => (
                                                    <tr
                                                        key={p.id}
                                                        className="border-b border-[#272727] hover:bg-[#272727] transition-colors"
                                                    >
                                                        <td className="py-3 px-3 text-gray-400">
                                                            {p.paid_at
                                                                ? new Date(p.paid_at).toLocaleDateString()
                                                                : new Date(p.created_at).toLocaleDateString()}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div>
                                                                <p className="font-medium text-white truncate max-w-[140px]">
                                                                    {p.user?.name || p.user?.username || "—"}
                                                                </p>
                                                                {p.user?.email && (
                                                                    <p className="text-xs text-gray-500 truncate max-w-[140px]">
                                                                        {p.user.email}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 font-bold">
                                                            ${p.amount.toFixed(2)}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <span
                                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}
                                                            >
                                                                {p.substatus || p.status || "pending"}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3 text-gray-400 text-xs">
                                                            {formatBillingReason(p.billing_reason)}
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <CreditCard className="w-3.5 h-3.5 text-gray-600" />
                                                                <span className="text-gray-400 text-xs capitalize">
                                                                    {p.card_brand || p.payment_method_type || "—"}
                                                                </span>
                                                                {p.card_last4 && (
                                                                    <span className="text-gray-600 text-xs">
                                                                        ••{p.card_last4}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3 text-gray-500">
                                                            {p.refunded_amount && p.refunded_amount > 0
                                                                ? `$${p.refunded_amount.toFixed(2)}`
                                                                : "—"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="py-12 text-center">
                                        <Receipt className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                                        <p className="text-gray-500">
                                            No payments found
                                            {filterReason !== "all" && (
                                                <span>
                                                    {" "}
                                                    for this filter.{" "}
                                                    <Link
                                                        href="/creator/revenue"
                                                        className="text-blue-400 hover:underline"
                                                    >
                                                        Show all
                                                    </Link>
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
