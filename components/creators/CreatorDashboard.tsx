"use client";

import { useState, useEffect, useCallback } from "react";
import type { Drama } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface CreatorDashboardProps {
  user: { id: string; email?: string };
  channel: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    avatar_url: string | null;
    stripe_account_id: string | null;
    subscriber_count: number;
    is_verified: boolean;
  };
  onNavigate: (view: "content" | "settings" | "new-drama") => void;
}

interface EarningsData {
  total: number;
  thisMonth: number;
  pending: number;
  totalViews: number;
  completionRate: number;
  monthlyRevenue: { month: string; amount: number }[];
}

/* ------------------------------------------------------------------ */
/*  Fallback / sample data (matches Creators.tsx)                       */
/* ------------------------------------------------------------------ */

const FALLBACK_EARNINGS: EarningsData = {
  total: 47_820,
  thisMonth: 8_420,
  pending: 4_215,
  totalViews: 2_180_000,
  completionRate: 72,
  monthlyRevenue: [
    { month: "Jan", amount: 3200 },
    { month: "Feb", amount: 4100 },
    { month: "Mar", amount: 5800 },
    { month: "Apr", amount: 6400 },
    { month: "May", amount: 7900 },
    { month: "Jun", amount: 8420 },
  ],
};

const FALLBACK_DRAMAS: (Drama & { views: number; revenue: number; trend: string })[] = [
  {
    id: "fallback-1",
    channel_id: "",
    title: "The Last Algorithm",
    logline: "A rogue AI discovers it can dream.",
    genre: "Sci-Fi",
    poster_gradient: "from-purple-900 to-black",
    poster_url:
      "https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=200&h=300&fit=crop",
    total_episodes: 6,
    status: "published",
    created_at: new Date().toISOString(),
    views: 892_000,
    revenue: 12_400,
    trend: "+18%",
  },
  {
    id: "fallback-2",
    channel_id: "",
    title: "Neon Hearts",
    logline: "Two strangers connected through a city's pulse.",
    genre: "Romance",
    poster_gradient: "from-pink-900 to-black",
    poster_url:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=200&h=300&fit=crop",
    total_episodes: 4,
    status: "published",
    created_at: new Date().toISOString(),
    views: 654_000,
    revenue: 8_900,
    trend: "+24%",
  },
  {
    id: "fallback-3",
    channel_id: "",
    title: "Underground Kings",
    logline: "Power has a price in the city underground.",
    genre: "Crime",
    poster_gradient: "from-gray-900 to-black",
    poster_url:
      "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=200&h=300&fit=crop",
    total_episodes: 8,
    status: "published",
    created_at: new Date().toISOString(),
    views: 1_230_000,
    revenue: 18_500,
    trend: "+12%",
  },
];

const CREATOR_TIERS = [
  { name: "Starter", min: 0, max: 1_000, rev: "80%", color: "#8b8aa0" },
  { name: "Rising", min: 1_000, max: 10_000, rev: "85%", color: "#00D2FF" },
  { name: "Partner", min: 10_000, max: 100_000, rev: "88%", color: "#FFAB00" },
  { name: "Elite", min: 100_000, max: Infinity, rev: "90%", color: "#6C5CE7" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatMoney(n: number) {
  return "$" + n.toLocaleString();
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function getCurrentTier(subscribers: number) {
  for (let i = CREATOR_TIERS.length - 1; i >= 0; i--) {
    if (subscribers >= CREATOR_TIERS[i].min) return CREATOR_TIERS[i];
  }
  return CREATOR_TIERS[0];
}

function getNextTier(subscribers: number) {
  for (const tier of CREATOR_TIERS) {
    if (subscribers < tier.max) {
      const idx = CREATOR_TIERS.indexOf(tier);
      if (idx < CREATOR_TIERS.length - 1) return CREATOR_TIERS[idx + 1];
      return null;
    }
  }
  return null;
}

function getTierProgress(subscribers: number): number {
  const current = getCurrentTier(subscribers);
  const next = getNextTier(subscribers);
  if (!next) return 100;
  const range = next.min - current.min;
  const progress = subscribers - current.min;
  return Math.min(100, Math.round((progress / range) * 100));
}

/* ------------------------------------------------------------------ */
/*  Skeleton component                                                  */
/* ------------------------------------------------------------------ */

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#1a1a30] ${className}`}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  CreatorDashboard                                                    */
/* ------------------------------------------------------------------ */

export default function CreatorDashboard({
  user,
  channel,
  onNavigate,
}: CreatorDashboardProps) {
  /* ── State ── */
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [dramas, setDramas] = useState<
    (Drama & { views: number; revenue: number; trend: string })[] | null
  >(null);
  const [loadingEarnings, setLoadingEarnings] = useState(true);
  const [loadingDramas, setLoadingDramas] = useState(true);
  const [payoutRequested, setPayoutRequested] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  /* ── Data fetching ── */
  useEffect(() => {
    let cancelled = false;

    async function fetchEarnings() {
      try {
        const res = await fetch("/api/creator/earnings");
        if (!res.ok) throw new Error("Failed to fetch earnings");
        const data = await res.json();
        if (!cancelled) {
          setEarnings({
            total: data.total ?? FALLBACK_EARNINGS.total,
            thisMonth: data.thisMonth ?? FALLBACK_EARNINGS.thisMonth,
            pending: data.pending ?? FALLBACK_EARNINGS.pending,
            totalViews: data.totalViews ?? FALLBACK_EARNINGS.totalViews,
            completionRate:
              data.completionRate ?? FALLBACK_EARNINGS.completionRate,
            monthlyRevenue:
              data.monthlyRevenue ?? FALLBACK_EARNINGS.monthlyRevenue,
          });
        }
      } catch {
        if (!cancelled) setEarnings(FALLBACK_EARNINGS);
      } finally {
        if (!cancelled) setLoadingEarnings(false);
      }
    }

    async function fetchDramas() {
      try {
        const res = await fetch("/api/creator/dramas");
        if (!res.ok) throw new Error("Failed to fetch dramas");
        const data = await res.json();
        if (!cancelled) {
          if (Array.isArray(data) && data.length > 0) {
            setDramas(
              data.slice(0, 3).map((d: Drama) => {
                const raw = d as unknown as Record<string, unknown>;
                return {
                  ...d,
                  views: (raw.views as number) ?? 0,
                  revenue: (raw.revenue as number) ?? 0,
                  trend: (raw.trend as string) ?? "",
                };
              })
            );
          } else {
            setDramas(FALLBACK_DRAMAS);
          }
        }
      } catch {
        if (!cancelled) setDramas(FALLBACK_DRAMAS);
      } finally {
        if (!cancelled) setLoadingDramas(false);
      }
    }

    fetchEarnings();
    fetchDramas();

    return () => {
      cancelled = true;
    };
  }, [user.id, channel.id]);

  /* ── Derived ── */
  const e = earnings ?? FALLBACK_EARNINGS;
  const maxRevenue = Math.max(...e.monthlyRevenue.map((m) => m.amount));
  const currentTier = getCurrentTier(channel.subscriber_count);
  const nextTier = getNextTier(channel.subscriber_count);
  const tierProgress = getTierProgress(channel.subscriber_count);

  // Compute % change for revenue chart header
  const revLen = e.monthlyRevenue.length;
  let revenueChange = "";
  if (revLen >= 2) {
    const prev = e.monthlyRevenue[revLen - 2].amount;
    const curr = e.monthlyRevenue[revLen - 1].amount;
    if (prev > 0) {
      const pct = Math.round(((curr - prev) / prev) * 100);
      revenueChange = pct >= 0 ? `+${pct}%` : `${pct}%`;
    }
  }

  /* ── Actions ── */
  const requestPayout = useCallback(() => {
    setPayoutRequested(true);
    setTimeout(() => setPayoutRequested(false), 3000);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  /* ── Render ── */
  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 pt-14 pb-24">
      <div className="max-w-md mx-auto">
        {/* ================================================================ */}
        {/*  1. CREATOR HEADER                                               */}
        {/* ================================================================ */}
        <div className="mb-6 animate-rise">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar */}
              {channel.avatar_url ? (
                <img
                  src={channel.avatar_url}
                  alt={channel.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#1a1a30] flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#FFAB00] flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold font-display text-[#07070e]">
                    {channel.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-display text-xl font-bold tracking-tight text-[#f0eef5] truncate">
                    {channel.name}
                  </h2>
                  {channel.is_verified && (
                    <svg
                      className="w-5 h-5 text-[#00D2FF] flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-[#8b8aa0] font-body">
                  {formatCount(channel.subscriber_count)} subscribers
                </p>
              </div>
            </div>

            {/* Edit Channel button */}
            <button
              onClick={() => onNavigate("settings")}
              className="px-3 py-1.5 rounded-xl bg-[#101020] border border-[#1a1a30] text-xs font-bold font-body text-[#8b8aa0] hover:text-[#f0eef5] hover:border-[#6C5CE7]/40 transition-all flex-shrink-0"
            >
              Edit Channel
            </button>
          </div>
        </div>

        {/* ================================================================ */}
        {/*  2. EARNINGS OVERVIEW (3 cards)                                   */}
        {/* ================================================================ */}
        <div className="grid grid-cols-3 gap-3 mb-4 animate-slide-up">
          {/* Total Earned */}
          <div className="bg-[#101020] rounded-2xl p-3.5 text-center border border-[#1a1a30]">
            {loadingEarnings ? (
              <>
                <Skeleton className="h-5 w-16 mx-auto mb-1.5" />
                <Skeleton className="h-2.5 w-12 mx-auto" />
              </>
            ) : (
              <>
                <p className="text-lg font-bold font-display text-[#FFAB00]">
                  {formatMoney(e.total)}
                </p>
                <p className="text-[10px] text-[#8b8aa0] uppercase tracking-wider mt-0.5">
                  Total Earned
                </p>
              </>
            )}
          </div>

          {/* This Month */}
          <div className="bg-[#101020] rounded-2xl p-3.5 text-center border border-[#1a1a30]">
            {loadingEarnings ? (
              <>
                <Skeleton className="h-5 w-14 mx-auto mb-1.5" />
                <Skeleton className="h-2.5 w-12 mx-auto" />
              </>
            ) : (
              <>
                <p className="text-lg font-bold font-display text-[#00D2FF]">
                  {formatMoney(e.thisMonth)}
                </p>
                <p className="text-[10px] text-[#8b8aa0] uppercase tracking-wider mt-0.5">
                  This Month
                </p>
              </>
            )}
          </div>

          {/* Pending Payout */}
          <div className="bg-[#101020] rounded-2xl p-3.5 text-center border border-[#1a1a30]">
            {loadingEarnings ? (
              <>
                <Skeleton className="h-5 w-14 mx-auto mb-1.5" />
                <Skeleton className="h-2.5 w-12 mx-auto" />
              </>
            ) : (
              <>
                <p className="text-lg font-bold font-display text-[#6C5CE7]">
                  {formatMoney(e.pending)}
                </p>
                <p className="text-[10px] text-[#8b8aa0] uppercase tracking-wider mt-0.5">
                  Pending
                </p>
              </>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/*  3. REVENUE CHART                                                */}
        {/* ================================================================ */}
        <div
          className="bg-[#101020] rounded-2xl p-5 border border-[#1a1a30] mb-4 animate-slide-up"
          style={{ animationDelay: "0.06s" }}
        >
          {loadingEarnings ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-28" />
              </div>
              <div className="space-y-2.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-body font-semibold text-sm text-[#f0eef5]">
                  Revenue
                </h3>
                {revenueChange && (
                  <span className="text-[10px] text-[#00D2FF] font-bold font-body flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={
                          revenueChange.startsWith("-")
                            ? "M19 14l-7 7m0 0l-7-7m7 7V3"
                            : "M5 10l7-7m0 0l7 7m-7-7v18"
                        }
                      />
                    </svg>
                    {revenueChange} vs last month
                  </span>
                )}
              </div>
              <div className="space-y-2.5">
                {e.monthlyRevenue.map((m) => (
                  <div key={m.month} className="flex items-center gap-3">
                    <span className="text-[11px] text-[#8b8aa0] font-body w-8">
                      {m.month}
                    </span>
                    <div className="flex-1 h-5 bg-[#1a1a30] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#FFAB00] transition-all duration-700"
                        style={{
                          width: `${maxRevenue > 0 ? (m.amount / maxRevenue) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-[#f0eef5] font-body font-medium tabular-nums w-12 text-right">
                      {formatMoney(m.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ================================================================ */}
        {/*  4. QUICK STATS ROW                                              */}
        {/* ================================================================ */}
        <div
          className="grid grid-cols-2 gap-3 mb-4 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          {/* Total Views */}
          <div className="bg-[#101020] rounded-2xl p-4 border border-[#1a1a30]">
            {loadingEarnings ? (
              <>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-6 w-16" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-4 h-4 text-[#FFAB00]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-xs text-[#8b8aa0] font-body">
                    Total Views
                  </span>
                </div>
                <p className="text-xl font-bold font-display text-[#f0eef5]">
                  {formatCount(e.totalViews)}
                </p>
              </>
            )}
          </div>

          {/* Completion Rate */}
          <div className="bg-[#101020] rounded-2xl p-4 border border-[#1a1a30]">
            {loadingEarnings ? (
              <>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-6 w-12" />
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-4 h-4 text-[#00D2FF]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    />
                  </svg>
                  <span className="text-xs text-[#8b8aa0] font-body">
                    Completion
                  </span>
                </div>
                <p className="text-xl font-bold font-display text-[#f0eef5]">
                  {e.completionRate}%
                </p>
              </>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/*  5. RECENT CONTENT                                               */}
        {/* ================================================================ */}
        <div
          className="mb-4 animate-slide-up"
          style={{ animationDelay: "0.14s" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-body font-semibold text-sm text-[#f0eef5]">
              Recent Content
            </h3>
            <button
              onClick={() => onNavigate("content")}
              className="text-[11px] font-bold font-body text-[#6C5CE7] hover:text-[#FFAB00] transition-colors"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {loadingDramas
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-[#101020] rounded-2xl p-4 border border-[#1a1a30]"
                  >
                    <div className="flex gap-3.5">
                      <Skeleton className="w-16 h-24 rounded-xl flex-shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-20 mb-3" />
                        <div className="flex gap-4">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              : (dramas ?? FALLBACK_DRAMAS).map((item, i) => (
                  <div
                    key={item.id}
                    className="bg-[#101020] rounded-2xl p-4 border border-[#1a1a30] animate-slide-up"
                    style={{ animationDelay: `${0.14 + (i + 1) * 0.05}s` }}
                  >
                    <div className="flex gap-3.5">
                      {/* Poster thumbnail */}
                      <div className="w-16 h-24 rounded-xl overflow-hidden bg-[#1a1a30] flex-shrink-0 relative">
                        {item.poster_url ? (
                          <img
                            src={item.poster_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className={`w-full h-full bg-gradient-to-b ${item.poster_gradient} flex items-center justify-center`}
                          >
                            <span className="text-lg font-bold font-display text-white/40">
                              {item.title.charAt(0)}
                            </span>
                          </div>
                        )}
                        {item.status === "draft" && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-[9px] font-bold text-[#FFAB00] uppercase tracking-wider">
                              Draft
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-body font-semibold text-sm text-[#f0eef5] truncate pr-2">
                            {item.title}
                          </h4>
                          {item.status === "published" && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00D2FF]/10 flex-shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#00D2FF] animate-pulse" />
                              <span className="text-[9px] font-bold text-[#00D2FF] uppercase">
                                Live
                              </span>
                            </span>
                          )}
                          {item.status === "draft" && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFAB00]/10 flex-shrink-0">
                              <span className="text-[9px] font-bold text-[#FFAB00] uppercase">
                                Draft
                              </span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] text-[#6C5CE7] font-bold font-body uppercase">
                            {item.genre}
                          </span>
                          <span className="text-[10px] text-[#8b8aa0] font-body">
                            {item.total_episodes} eps
                          </span>
                        </div>

                        {item.status === "published" && (
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="text-[10px] text-[#8b8aa0] font-body">
                                Views
                              </p>
                              <p className="text-xs font-bold font-body text-[#f0eef5]">
                                {formatCount(item.views)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-[#8b8aa0] font-body">
                                Revenue
                              </p>
                              <p className="text-xs font-bold font-body text-[#FFAB00]">
                                {formatMoney(item.revenue)}
                              </p>
                            </div>
                            {item.trend && (
                              <span className="text-[10px] font-bold text-[#00D2FF] font-body flex items-center gap-0.5">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2.5}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                                  />
                                </svg>
                                {item.trend}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>

        {/* ================================================================ */}
        {/*  6. QUICK ACTIONS                                                */}
        {/* ================================================================ */}
        <div
          className="grid grid-cols-2 gap-3 mb-4 animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          {/* New Drama */}
          <button
            onClick={() => onNavigate("new-drama")}
            className="bg-[#101020] rounded-2xl p-4 border border-[#1a1a30] hover:border-[#6C5CE7]/40 transition-all active:scale-[0.97] text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#6C5CE7]/15 flex items-center justify-center mb-2.5 group-hover:bg-[#6C5CE7]/25 transition-colors">
              <svg
                className="w-4.5 h-4.5 text-[#6C5CE7]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>
            <p className="text-xs font-bold font-body text-[#f0eef5]">
              New Drama
            </p>
            <p className="text-[10px] text-[#8b8aa0] font-body mt-0.5">
              Create a new series
            </p>
          </button>

          {/* Manage Content */}
          <button
            onClick={() => onNavigate("content")}
            className="bg-[#101020] rounded-2xl p-4 border border-[#1a1a30] hover:border-[#FFAB00]/40 transition-all active:scale-[0.97] text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FFAB00]/15 flex items-center justify-center mb-2.5 group-hover:bg-[#FFAB00]/25 transition-colors">
              <svg
                className="w-4.5 h-4.5 text-[#FFAB00]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5"
                />
              </svg>
            </div>
            <p className="text-xs font-bold font-body text-[#f0eef5]">
              Manage Content
            </p>
            <p className="text-[10px] text-[#8b8aa0] font-body mt-0.5">
              Edit your dramas
            </p>
          </button>

          {/* Channel Settings */}
          <button
            onClick={() => onNavigate("settings")}
            className="bg-[#101020] rounded-2xl p-4 border border-[#1a1a30] hover:border-[#00D2FF]/40 transition-all active:scale-[0.97] text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#00D2FF]/15 flex items-center justify-center mb-2.5 group-hover:bg-[#00D2FF]/25 transition-colors">
              <svg
                className="w-4.5 h-4.5 text-[#00D2FF]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <p className="text-xs font-bold font-body text-[#f0eef5]">
              Channel Settings
            </p>
            <p className="text-[10px] text-[#8b8aa0] font-body mt-0.5">
              Profile & preferences
            </p>
          </button>

          {/* View Analytics */}
          <button
            onClick={() => showToast("Analytics coming soon")}
            className="bg-[#101020] rounded-2xl p-4 border border-[#1a1a30] hover:border-[#8b8aa0]/40 transition-all active:scale-[0.97] text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#8b8aa0]/15 flex items-center justify-center mb-2.5 group-hover:bg-[#8b8aa0]/25 transition-colors">
              <svg
                className="w-4.5 h-4.5 text-[#8b8aa0]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>
            <p className="text-xs font-bold font-body text-[#f0eef5]">
              View Analytics
            </p>
            <p className="text-[10px] text-[#8b8aa0] font-body mt-0.5">
              Coming soon
            </p>
          </button>
        </div>

        {/* ================================================================ */}
        {/*  7. PAYOUT SECTION                                               */}
        {/* ================================================================ */}
        <div
          className="mb-4 animate-slide-up"
          style={{ animationDelay: "0.24s" }}
        >
          {channel.stripe_account_id ? (
            /* Stripe connected: show payout button */
            <>
              <button
                onClick={requestPayout}
                disabled={payoutRequested || loadingEarnings}
                className={`w-full py-4 rounded-2xl font-bold font-body text-base tracking-wide transition-all duration-300 ${
                  payoutRequested
                    ? "bg-[#00D2FF]/15 text-[#00D2FF] border border-[#00D2FF]/30"
                    : "bg-gradient-to-r from-[#6C5CE7] to-[#FFAB00] text-[#07070e] hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {payoutRequested ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Payout Requested — {formatMoney(e.pending)}
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                      />
                    </svg>
                    Request Payout — {formatMoney(e.pending)}
                  </span>
                )}
              </button>

              {/* Stripe badge */}
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <svg
                  className="w-3 h-3 text-[#635BFF]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                </svg>
                <span className="text-[10px] text-[#8b8aa0] font-body">
                  Payouts via Stripe Connect
                </span>
              </div>
            </>
          ) : (
            /* Stripe not connected: show connect CTA */
            <button
              onClick={() => showToast("Stripe Connect setup coming soon")}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-[#635BFF]/40 bg-[#635BFF]/5 flex items-center justify-center gap-3 hover:border-[#635BFF]/60 hover:bg-[#635BFF]/10 transition-all active:scale-[0.98]"
            >
              <svg
                className="w-6 h-6 text-[#635BFF]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-bold font-body text-[#f0eef5]">
                  Connect Stripe
                </p>
                <p className="text-[11px] text-[#8b8aa0] font-body">
                  Set up payouts to start earning
                </p>
              </div>
            </button>
          )}
        </div>

        {/* ================================================================ */}
        {/*  8. CREATOR TIER CARD                                            */}
        {/* ================================================================ */}
        <div
          className="bg-[#101020] rounded-2xl p-5 border border-[#1a1a30] mb-4 animate-slide-up"
          style={{ animationDelay: "0.28s" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-body font-semibold text-sm text-[#f0eef5]">
              Creator Tier
            </h3>
            <span
              className="text-xs font-bold font-body px-2.5 py-0.5 rounded-full"
              style={{
                color: currentTier.color,
                background: `${currentTier.color}15`,
              }}
            >
              {currentTier.name}
            </span>
          </div>

          {/* Current tier info */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${currentTier.color}20` }}
            >
              <svg
                className="w-5 h-5"
                style={{ color: currentTier.color }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold font-body text-[#f0eef5]">
                {currentTier.rev} Revenue Share
              </p>
              <p className="text-[11px] text-[#8b8aa0] font-body">
                {formatCount(channel.subscriber_count)} subscribers
              </p>
            </div>
          </div>

          {/* Progress bar toward next tier */}
          {nextTier && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-[#8b8aa0] font-body">
                  Progress to {nextTier.name}
                </span>
                <span className="text-[10px] font-bold font-body" style={{ color: nextTier.color }}>
                  {formatCount(nextTier.min)} needed
                </span>
              </div>
              <div className="h-2 bg-[#1a1a30] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${tierProgress}%`,
                    background: `linear-gradient(to right, ${currentTier.color}, ${nextTier.color})`,
                  }}
                />
              </div>
              <p className="text-[10px] text-[#8b8aa0] font-body mt-1">
                {formatCount(Math.max(0, nextTier.min - channel.subscriber_count))} more to unlock {nextTier.rev} share
              </p>
            </div>
          )}

          {/* All tiers */}
          <div className="space-y-2 mt-3 pt-3 border-t border-[#1a1a30]">
            <p className="text-[10px] text-[#8b8aa0] uppercase tracking-wider font-body mb-2">
              All Tiers
            </p>
            {CREATOR_TIERS.map((tier) => {
              const isActive = tier.name === currentTier.name;
              return (
                <div
                  key={tier.name}
                  className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl transition-colors ${
                    isActive
                      ? "border"
                      : "bg-[#1a1a30]/50"
                  }`}
                  style={
                    isActive
                      ? {
                          background: `${tier.color}08`,
                          borderColor: `${tier.color}33`,
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: tier.color }}
                    />
                    <span className="text-xs font-body font-semibold text-[#f0eef5]">
                      {tier.name}
                    </span>
                    <span className="text-[10px] text-[#8b8aa0] font-body">
                      {tier.max === Infinity
                        ? `${formatCount(tier.min)}+`
                        : `${formatCount(tier.min)}–${formatCount(tier.max)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="text-xs font-bold font-body"
                      style={{ color: tier.color }}
                    >
                      {tier.rev}
                    </span>
                    {isActive && (
                      <span
                        className="text-[9px] font-bold ml-1 tracking-wider"
                        style={{ color: tier.color }}
                      >
                        YOU
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          className="text-center py-4 animate-rise"
          style={{ animationDelay: "0.32s" }}
        >
          <p className="text-[10px] text-[#8b8aa0]/60 font-body leading-relaxed">
            Powered by Versa TV Creator Platform
            <br />
            Meridian Studios — $250M production facility
          </p>
        </div>
      </div>

      {/* ── Toast ── */}
      {toastMessage && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className="bg-[#101020] border border-[#1a1a30] rounded-xl px-4 py-2.5 shadow-lg shadow-black/40">
            <p className="text-xs font-body font-semibold text-[#f0eef5]">
              {toastMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
