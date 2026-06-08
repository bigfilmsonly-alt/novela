"use client";

import { useState, useEffect, useCallback } from "react";
import type { Drama } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface ContentManagerProps {
  channelId: string;
  onBack: () => void;
  onNewDrama: () => void;
  onEditDrama: (dramaId: string) => void;
  onManageEpisodes?: (dramaId: string, dramaTitle: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatMoney(n: number) {
  return "$" + n.toLocaleString();
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */
function DramaCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="bg-[#101020] rounded-2xl p-4 border border-[#1a1a30] animate-slide-up"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="flex gap-3.5">
        <div className="w-16 h-24 rounded-xl bg-[#1a1a30] flex-shrink-0 animate-pulse" />
        <div className="flex-1 space-y-2.5">
          <div className="h-4 bg-[#1a1a30] rounded-lg w-3/4 animate-pulse" />
          <div className="h-3 bg-[#1a1a30] rounded-lg w-1/2 animate-pulse" />
          <div className="flex gap-3 mt-2">
            <div className="h-8 bg-[#1a1a30] rounded-lg w-16 animate-pulse" />
            <div className="h-8 bg-[#1a1a30] rounded-lg w-16 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Confirm dialog                                                     */
/* ------------------------------------------------------------------ */
function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#101020] rounded-2xl p-6 border border-[#1a1a30] w-full max-w-sm animate-slide-up">
        <h3 className="font-display text-lg font-bold text-[#f0eef5] mb-2">
          {title}
        </h3>
        <p className="text-sm text-[#8b8aa0] font-body mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-[#1a1a30] text-sm font-bold font-body text-[#8b8aa0] hover:text-[#f0eef5] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500/20 text-sm font-bold font-body text-red-400 hover:bg-red-500/30 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status badge                                                       */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }: { status: Drama["status"] }) {
  const config = {
    published: {
      bg: "bg-[#00D2FF]/10",
      text: "text-[#00D2FF]",
      dot: "bg-[#00D2FF]",
      label: "Live",
      pulse: true,
    },
    draft: {
      bg: "bg-[#FFAB00]/10",
      text: "text-[#FFAB00]",
      dot: "bg-[#FFAB00]",
      label: "Draft",
      pulse: false,
    },
    archived: {
      bg: "bg-[#8b8aa0]/10",
      text: "text-[#8b8aa0]",
      dot: "bg-[#8b8aa0]",
      label: "Archived",
      pulse: false,
    },
  };

  const c = config[status];

  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${c.bg} flex-shrink-0`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${c.pulse ? "animate-pulse" : ""}`} />
      <span className={`text-[9px] font-bold ${c.text} uppercase`}>{c.label}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Extended drama type with optional analytics                        */
/* ------------------------------------------------------------------ */
interface DramaWithAnalytics extends Drama {
  views?: number;
  revenue?: number;
  trend?: string;
  episode_count?: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function ContentManager({
  channelId,
  onBack,
  onNewDrama,
  onEditDrama,
}: ContentManagerProps) {
  const [dramas, setDramas] = useState<DramaWithAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  /* ── Fetch dramas ── */
  const fetchDramas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/creator/dramas");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to load content (${res.status})`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setDramas(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDramas();
  }, [fetchDramas]);

  /* ── Publish / unpublish ── */
  const togglePublish = useCallback(async (drama: DramaWithAnalytics) => {
    setPublishingId(drama.id);
    setActionMenu(null);
    try {
      const newStatus = drama.status === "published" ? "draft" : "published";
      const res = await fetch(`/api/creator/dramas/${drama.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }
      setDramas((prev) =>
        prev.map((d) =>
          d.id === drama.id ? { ...d, status: newStatus as Drama["status"] } : d
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setPublishingId(null);
    }
  }, []);

  /* ── Delete ── */
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await fetch(`/api/creator/dramas/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete");
      }
      setDramas((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }, [deleteTarget]);

  /* ── Totals ── */
  const totalEpisodes = dramas.reduce(
    (acc, d) => acc + (d.episode_count ?? d.total_episodes ?? 0),
    0
  );

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 pt-14 pb-24">
      <div className="max-w-md mx-auto">
        {/* ── Header with back button ── */}
        <div className="flex items-center gap-3 mb-6 animate-rise">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-[#101020] border border-[#1a1a30] flex items-center justify-center hover:bg-[#1a1a30] transition-colors active:scale-90"
          >
            <svg
              className="w-5 h-5 text-[#f0eef5]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#f0eef5]">
              My Content
            </h2>
            <p className="text-xs text-[#8b8aa0] font-body">
              Manage your dramas and episodes
            </p>
          </div>
        </div>

        {/* ── Upload CTA ── */}
        <button
          onClick={onNewDrama}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-[#6C5CE7]/40 bg-[#6C5CE7]/5 flex items-center justify-center gap-3 hover:border-[#6C5CE7]/60 hover:bg-[#6C5CE7]/10 transition-all active:scale-[0.98] animate-slide-up mb-4"
        >
          <div className="w-10 h-10 rounded-full bg-[#6C5CE7]/20 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-[#6C5CE7]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold font-body text-[#f0eef5]">
              Upload New Drama
            </p>
            <p className="text-[11px] text-[#8b8aa0] font-body">
              Import video or create with AI Studio
            </p>
          </div>
        </button>

        {/* ── Error Banner ── */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 animate-fade-in">
            <svg
              className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-xs text-red-400 font-body">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400/60 hover:text-red-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <DramaCardSkeleton key={i} index={i} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && dramas.length === 0 && !error && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-[#6C5CE7]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 12 6 12.504 6 13.125"
                />
              </svg>
            </div>
            <h3 className="font-display text-lg font-bold text-[#f0eef5] mb-1.5">
              No content yet
            </h3>
            <p className="text-sm text-[#8b8aa0] font-body mb-5">
              Create your first drama and start building your audience
            </p>
            <button
              onClick={onNewDrama}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#FFAB00] text-[#07070e] text-sm font-bold font-body hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create First Drama
            </button>
          </div>
        )}

        {/* ── Content cards ── */}
        {!loading && dramas.length > 0 && (
          <div className="space-y-4">
            {dramas.map((drama, i) => (
              <div
                key={drama.id}
                className="bg-[#101020] rounded-2xl p-4 border border-[#1a1a30] animate-slide-up relative"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="flex gap-3.5">
                  {/* Poster thumbnail */}
                  <div className="w-16 h-24 rounded-xl overflow-hidden bg-[#1a1a30] flex-shrink-0 relative">
                    {drama.poster_url ? (
                      <img
                        src={drama.poster_url}
                        alt={drama.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${drama.poster_gradient || "from-[#6C5CE7]/40 to-[#1a1a30]"} flex items-center justify-center`}
                      >
                        <svg
                          className="w-6 h-6 text-white/30"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125"
                          />
                        </svg>
                      </div>
                    )}
                    {drama.status === "draft" && (
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
                        {drama.title}
                      </h4>
                      <StatusBadge status={drama.status} />
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] text-[#6C5CE7] font-bold font-body uppercase">
                        {drama.genre}
                      </span>
                      <span className="text-[10px] text-[#8b8aa0] font-body">
                        {drama.episode_count ?? drama.total_episodes} eps
                      </span>
                    </div>

                    {/* Live drama stats */}
                    {drama.status === "published" && (
                      <div className="flex items-center gap-4">
                        {drama.views !== undefined && (
                          <div>
                            <p className="text-[10px] text-[#8b8aa0] font-body">Views</p>
                            <p className="text-xs font-bold font-body text-[#f0eef5]">
                              {formatCount(drama.views)}
                            </p>
                          </div>
                        )}
                        {drama.revenue !== undefined && (
                          <div>
                            <p className="text-[10px] text-[#8b8aa0] font-body">Revenue</p>
                            <p className="text-xs font-bold font-body text-[#FFAB00]">
                              {formatMoney(drama.revenue)}
                            </p>
                          </div>
                        )}
                        {drama.trend && (
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
                            {drama.trend}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Draft actions */}
                    {drama.status === "draft" && (
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => onEditDrama(drama.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#6C5CE7]/15 text-[#6C5CE7] text-[11px] font-bold font-body hover:bg-[#6C5CE7]/25 transition-colors"
                        >
                          Continue Editing
                        </button>
                        <button
                          onClick={() => togglePublish(drama)}
                          disabled={publishingId === drama.id}
                          className="px-3 py-1.5 rounded-lg bg-[#00D2FF]/15 text-[#00D2FF] text-[11px] font-bold font-body hover:bg-[#00D2FF]/25 transition-colors disabled:opacity-50"
                        >
                          {publishingId === drama.id ? "Publishing..." : "Publish"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action menu toggle */}
                  <button
                    onClick={() => setActionMenu(actionMenu === drama.id ? null : drama.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#1a1a30] transition-colors self-start flex-shrink-0"
                  >
                    <svg
                      className="w-4 h-4 text-[#8b8aa0]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                      />
                    </svg>
                  </button>
                </div>

                {/* Action dropdown */}
                {actionMenu === drama.id && (
                  <div className="absolute right-4 top-14 z-10 bg-[#1a1a30] rounded-xl border border-[#2a2a40] shadow-xl shadow-black/40 overflow-hidden animate-fade-in min-w-[140px]">
                    <button
                      onClick={() => {
                        setActionMenu(null);
                        onEditDrama(drama.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-body text-[#f0eef5] hover:bg-[#101020] transition-colors text-left"
                    >
                      <svg className="w-3.5 h-3.5 text-[#8b8aa0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => togglePublish(drama)}
                      disabled={publishingId === drama.id}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-body text-[#f0eef5] hover:bg-[#101020] transition-colors text-left disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5 text-[#8b8aa0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {drama.status === "published" ? (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        )}
                      </svg>
                      {drama.status === "published" ? "Unpublish" : "Publish"}
                    </button>
                    <div className="h-px bg-[#2a2a40]" />
                    <button
                      onClick={() => {
                        setActionMenu(null);
                        setDeleteTarget(drama.id);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-body text-red-400 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* ── Total stats ── */}
            <div
              className="bg-[#101020] rounded-2xl p-4 border border-[#1a1a30] animate-slide-up"
              style={{ animationDelay: `${dramas.length * 0.06 + 0.06}s` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8b8aa0] font-body">Total Content</span>
                <span className="text-xs font-bold text-[#f0eef5] font-body">
                  {dramas.length} series &middot; {totalEpisodes} episodes
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete confirm dialog ── */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Drama"
          message="This will permanently delete this drama and all its episodes. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Close action menu on outside click ── */}
      {actionMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenu(null)}
        />
      )}
    </div>
  );
}
