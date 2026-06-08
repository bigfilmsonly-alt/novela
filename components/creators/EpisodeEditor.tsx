"use client";

import { useState, useEffect, useCallback } from "react";
import type { Episode } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface EpisodeEditorProps {
  dramaId: string;
  dramaTitle: string;
  onBack: () => void;
}

/* ------------------------------------------------------------------ */
/*  Episode form state                                                 */
/* ------------------------------------------------------------------ */
interface EpisodeFormState {
  episode_number: number;
  title: string;
  synopsis: string;
  video_url: string;
  poster_url: string;
  duration_sec: number | null;
  locked: boolean;
  price_cents: number;
}

const EMPTY_FORM = (nextNumber: number): EpisodeFormState => ({
  episode_number: nextNumber,
  title: "",
  synopsis: "",
  video_url: "",
  poster_url: "",
  duration_sec: null,
  locked: false,
  price_cents: 299,
});

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatDuration(sec: number | null): string {
  if (!sec) return "--:--";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/* ------------------------------------------------------------------ */
/*  Skeleton loader                                                    */
/* ------------------------------------------------------------------ */
function EpisodeSkeleton({ index }: { index: number }) {
  return (
    <div
      className="bg-[#101020] rounded-2xl p-4 border border-[#1a1a30] animate-slide-up"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#1a1a30] animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#1a1a30] rounded-lg w-2/3 animate-pulse" />
          <div className="h-3 bg-[#1a1a30] rounded-lg w-full animate-pulse" />
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
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function EpisodeEditor({
  dramaId,
  dramaTitle,
  onBack,
}: EpisodeEditorProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  /* Form state */
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EpisodeFormState>(EMPTY_FORM(1));
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  /* ── Fetch episodes ── */
  const fetchEpisodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/creator/dramas/${dramaId}/episodes`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to load episodes (${res.status})`);
      }
      const data = await res.json();
      const list: Episode[] = Array.isArray(data) ? data : [];
      list.sort((a, b) => a.episode_number - b.episode_number);
      setEpisodes(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load episodes");
    } finally {
      setLoading(false);
    }
  }, [dramaId]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  /* ── Form helpers ── */
  const updateField = useCallback(
    <K extends keyof EpisodeFormState>(field: K, value: EpisodeFormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const openNewForm = useCallback(() => {
    const nextNum = episodes.length > 0
      ? Math.max(...episodes.map((e) => e.episode_number)) + 1
      : 1;
    setForm(EMPTY_FORM(nextNum));
    setEditingId(null);
    setFormErrors({});
    setShowForm(true);
  }, [episodes]);

  const openEditForm = useCallback((ep: Episode) => {
    setForm({
      episode_number: ep.episode_number,
      title: ep.title || "",
      synopsis: ep.synopsis || "",
      video_url: ep.video_url || "",
      poster_url: ep.poster_url || "",
      duration_sec: ep.duration_sec,
      locked: ep.locked,
      price_cents: ep.price_cents || 299,
    });
    setEditingId(ep.id);
    setFormErrors({});
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setFormErrors({});
  }, []);

  /* ── Validate ── */
  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) {
      errors.title = "Episode title is required";
    }
    if (!form.synopsis.trim()) {
      errors.synopsis = "Synopsis is required";
    }
    if (form.locked && form.price_cents < 99) {
      errors.price_cents = "Minimum price is $0.99";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  /* ── Save episode ── */
  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setSaving(true);
    setError(null);
    try {
      const isEdit = Boolean(editingId);
      const url = isEdit
        ? `/api/creator/dramas/${dramaId}/episodes/${editingId}`
        : `/api/creator/dramas/${dramaId}/episodes`;
      const method = isEdit ? "PUT" : "POST";

      const body = {
        episode_number: form.episode_number,
        title: form.title.trim(),
        synopsis: form.synopsis.trim(),
        video_url: form.video_url.trim() || null,
        poster_url: form.poster_url.trim() || null,
        duration_sec: form.duration_sec,
        locked: form.locked,
        price_cents: form.locked ? form.price_cents : 0,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save episode (${res.status})`);
      }

      const saved: Episode = await res.json();

      if (isEdit) {
        setEpisodes((prev) =>
          prev
            .map((ep) => (ep.id === editingId ? saved : ep))
            .sort((a, b) => a.episode_number - b.episode_number)
        );
      } else {
        setEpisodes((prev) =>
          [...prev, saved].sort((a, b) => a.episode_number - b.episode_number)
        );
      }

      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save episode");
    } finally {
      setSaving(false);
    }
  }, [form, editingId, dramaId, validate, closeForm]);

  /* ── Delete episode ── */
  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    try {
      const res = await fetch(
        `/api/creator/dramas/${dramaId}/episodes/${id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete episode");
      }
      setEpisodes((prev) => prev.filter((ep) => ep.id !== id));
      if (editingId === id) closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete episode");
    }
  }, [deleteTarget, dramaId, editingId, closeForm]);

  /* ── Reorder (move up / down) ── */
  const moveEpisode = useCallback(
    async (episodeId: string, direction: "up" | "down") => {
      const idx = episodes.findIndex((e) => e.id === episodeId);
      if (idx === -1) return;
      if (direction === "up" && idx === 0) return;
      if (direction === "down" && idx === episodes.length - 1) return;

      const swapIdx = direction === "up" ? idx - 1 : idx + 1;
      const current = episodes[idx];
      const swap = episodes[swapIdx];

      /* Optimistic update */
      const updated = [...episodes];
      updated[idx] = { ...current, episode_number: swap.episode_number };
      updated[swapIdx] = { ...swap, episode_number: current.episode_number };
      updated.sort((a, b) => a.episode_number - b.episode_number);
      setEpisodes(updated);

      /* Persist both swaps */
      try {
        const [r1, r2] = await Promise.all([
          fetch(`/api/creator/dramas/${dramaId}/episodes/${current.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ episode_number: swap.episode_number }),
          }),
          fetch(`/api/creator/dramas/${dramaId}/episodes/${swap.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ episode_number: current.episode_number }),
          }),
        ]);
        if (!r1.ok || !r2.ok) {
          throw new Error("Failed to reorder");
        }
      } catch {
        /* Revert on failure */
        fetchEpisodes();
        setError("Failed to reorder episodes. Changes reverted.");
      }
    },
    [episodes, dramaId, fetchEpisodes]
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
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#f0eef5] truncate">
              Episodes
            </h2>
            <p className="text-xs text-[#8b8aa0] font-body truncate">
              {dramaTitle}
            </p>
          </div>
        </div>

        {/* ── Error banner ── */}
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
            <p className="text-xs text-red-400 font-body flex-1">{error}</p>
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

        {/* ── Add episode button ── */}
        {!showForm && (
          <button
            onClick={openNewForm}
            className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#6C5CE7]/40 bg-[#6C5CE7]/5 flex items-center justify-center gap-2.5 hover:border-[#6C5CE7]/60 hover:bg-[#6C5CE7]/10 transition-all active:scale-[0.98] animate-slide-up mb-4"
          >
            <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/20 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-[#6C5CE7]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <span className="text-sm font-bold font-body text-[#f0eef5]">
              Add Episode
            </span>
          </button>
        )}

        {/* ── Inline episode form ── */}
        {showForm && (
          <div className="bg-[#101020] rounded-2xl p-5 border border-[#6C5CE7]/30 mb-4 animate-slide-up space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-body font-semibold text-sm text-[#f0eef5]">
                {editingId ? "Edit Episode" : "New Episode"}
              </h3>
              <button
                onClick={closeForm}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#1a1a30] transition-colors"
              >
                <svg
                  className="w-4 h-4 text-[#8b8aa0]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Episode number */}
            <div>
              <label className="block text-[10px] text-[#8b8aa0] font-body font-semibold uppercase tracking-wider mb-1">
                Episode Number
              </label>
              <div className="flex items-center gap-2">
                <div className="w-12 h-10 rounded-xl bg-[#6C5CE7]/15 flex items-center justify-center">
                  <span className="text-sm font-bold font-body text-[#6C5CE7]">
                    {form.episode_number}
                  </span>
                </div>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={form.episode_number}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1) {
                      updateField("episode_number", val);
                    }
                  }}
                  className="w-20 bg-[#1a1a30] rounded-xl p-2.5 text-sm text-[#f0eef5] font-body text-center focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 transition-all tabular-nums"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[10px] text-[#8b8aa0] font-body font-semibold uppercase tracking-wider mb-1">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="Episode title"
                className={`w-full bg-[#1a1a30] rounded-xl p-3 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 focus:outline-none focus:ring-2 transition-all ${
                  formErrors.title
                    ? "ring-2 ring-red-500/50 focus:ring-red-500/50"
                    : "focus:ring-[#6C5CE7]/50"
                }`}
              />
              {formErrors.title && (
                <p className="text-[10px] text-red-400 font-body mt-1">{formErrors.title}</p>
              )}
            </div>

            {/* Synopsis */}
            <div>
              <label className="block text-[10px] text-[#8b8aa0] font-body font-semibold uppercase tracking-wider mb-1">
                Synopsis <span className="text-red-400">*</span>
              </label>
              <textarea
                value={form.synopsis}
                onChange={(e) => updateField("synopsis", e.target.value)}
                placeholder="What happens in this episode..."
                rows={3}
                className={`w-full bg-[#1a1a30] rounded-xl p-3 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 resize-none focus:outline-none focus:ring-2 transition-all ${
                  formErrors.synopsis
                    ? "ring-2 ring-red-500/50 focus:ring-red-500/50"
                    : "focus:ring-[#6C5CE7]/50"
                }`}
              />
              {formErrors.synopsis && (
                <p className="text-[10px] text-red-400 font-body mt-1">{formErrors.synopsis}</p>
              )}
            </div>

            {/* Video URL */}
            <div>
              <label className="block text-[10px] text-[#8b8aa0] font-body font-semibold uppercase tracking-wider mb-1">
                Video URL
              </label>
              <input
                type="url"
                value={form.video_url}
                onChange={(e) => updateField("video_url", e.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full bg-[#1a1a30] rounded-xl p-3 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 transition-all"
              />
            </div>

            {/* Poster URL */}
            <div>
              <label className="block text-[10px] text-[#8b8aa0] font-body font-semibold uppercase tracking-wider mb-1">
                Episode Poster URL
              </label>
              <input
                type="url"
                value={form.poster_url}
                onChange={(e) => updateField("poster_url", e.target.value)}
                placeholder="https://example.com/thumbnail.jpg"
                className="w-full bg-[#1a1a30] rounded-xl p-3 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 transition-all"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-[10px] text-[#8b8aa0] font-body font-semibold uppercase tracking-wider mb-1">
                Duration (seconds)
              </label>
              <div className="flex items-center gap-2.5">
                <input
                  type="number"
                  min={0}
                  value={form.duration_sec ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : null;
                    updateField("duration_sec", val);
                  }}
                  placeholder="120"
                  className="w-28 bg-[#1a1a30] rounded-xl p-3 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 transition-all tabular-nums"
                />
                <span className="text-xs text-[#8b8aa0] font-body">
                  {formatDuration(form.duration_sec)}
                </span>
              </div>
            </div>

            {/* Locked toggle + price */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10px] text-[#8b8aa0] font-body font-semibold uppercase tracking-wider">
                    Premium (Locked)
                  </label>
                  <p className="text-[10px] text-[#8b8aa0]/60 font-body">
                    Require payment to unlock
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateField("locked", !form.locked)}
                  className={`relative w-12 h-7 rounded-full transition-all duration-200 ${
                    form.locked ? "bg-[#6C5CE7]" : "bg-[#1a1a30]"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      form.locked ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {form.locked && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] text-[#8b8aa0] font-body font-semibold uppercase tracking-wider mb-1">
                    Price (cents)
                  </label>
                  <div className="flex items-center gap-2.5">
                    <input
                      type="number"
                      min={99}
                      step={50}
                      value={form.price_cents}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) updateField("price_cents", val);
                      }}
                      className={`w-28 bg-[#1a1a30] rounded-xl p-3 text-sm text-[#f0eef5] font-body focus:outline-none focus:ring-2 transition-all tabular-nums ${
                        formErrors.price_cents
                          ? "ring-2 ring-red-500/50 focus:ring-red-500/50"
                          : "focus:ring-[#6C5CE7]/50"
                      }`}
                    />
                    <span className="text-sm font-bold font-body text-[#FFAB00]">
                      {formatPrice(form.price_cents)}
                    </span>
                  </div>
                  {formErrors.price_cents && (
                    <p className="text-[10px] text-red-400 font-body mt-1">{formErrors.price_cents}</p>
                  )}
                </div>
              )}
            </div>

            {/* Save / cancel */}
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={closeForm}
                className="flex-1 py-3 rounded-xl bg-[#1a1a30] text-xs font-bold font-body text-[#8b8aa0] hover:text-[#f0eef5] transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#FFAB00] text-[#07070e] text-xs font-bold font-body hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {editingId ? "Update Episode" : "Add Episode"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <EpisodeSkeleton key={i} index={i} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && episodes.length === 0 && !showForm && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-[#6C5CE7]/10 flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-7 h-7 text-[#6C5CE7]"
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
            <h3 className="font-display text-base font-bold text-[#f0eef5] mb-1">
              No episodes yet
            </h3>
            <p className="text-xs text-[#8b8aa0] font-body mb-4">
              Add your first episode to get started
            </p>
            <button
              onClick={openNewForm}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#FFAB00] text-[#07070e] text-xs font-bold font-body hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add First Episode
            </button>
          </div>
        )}

        {/* ── Episode list ── */}
        {!loading && episodes.length > 0 && (
          <div className="space-y-3">
            {episodes.map((ep, i) => (
              <div
                key={ep.id}
                className={`bg-[#101020] rounded-2xl p-4 border transition-all animate-slide-up ${
                  editingId === ep.id
                    ? "border-[#6C5CE7]/40"
                    : "border-[#1a1a30]"
                }`}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  {/* Episode number badge */}
                  <div className="w-9 h-9 rounded-xl bg-[#6C5CE7]/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold font-body text-[#6C5CE7] tabular-nums">
                      {ep.episode_number}
                    </span>
                  </div>

                  {/* Episode info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-0.5">
                      <h4 className="font-body font-semibold text-sm text-[#f0eef5] truncate pr-2">
                        {ep.title || `Episode ${ep.episode_number}`}
                      </h4>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {ep.locked && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#FFAB00]/10">
                            <svg
                              className="w-2.5 h-2.5 text-[#FFAB00]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                              />
                            </svg>
                            <span className="text-[9px] font-bold text-[#FFAB00]">
                              {formatPrice(ep.price_cents)}
                            </span>
                          </span>
                        )}
                        {ep.video_url && (
                          <span className="w-5 h-5 rounded-full bg-[#00D2FF]/10 flex items-center justify-center" title="Has video">
                            <svg
                              className="w-2.5 h-2.5 text-[#00D2FF]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2.5}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>

                    {ep.synopsis && (
                      <p className="text-[11px] text-[#8b8aa0] font-body line-clamp-2 mb-2">
                        {ep.synopsis}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-[#8b8aa0] font-body">
                      {ep.duration_sec != null && ep.duration_sec > 0 && (
                        <span>{formatDuration(ep.duration_sec)}</span>
                      )}
                      {ep.view_count > 0 && (
                        <span>{ep.view_count.toLocaleString()} views</span>
                      )}
                      {ep.like_count > 0 && (
                        <span>{ep.like_count.toLocaleString()} likes</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#1a1a30]">
                  {/* Reorder buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveEpisode(ep.id, "up")}
                      disabled={i === 0}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#1a1a30] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <svg
                        className="w-3.5 h-3.5 text-[#8b8aa0]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveEpisode(ep.id, "down")}
                      disabled={i === episodes.length - 1}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#1a1a30] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <svg
                        className="w-3.5 h-3.5 text-[#8b8aa0]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Edit / Delete */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(ep)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-body text-[#6C5CE7] hover:bg-[#6C5CE7]/10 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(ep.id)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold font-body text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Episode count summary */}
            <div
              className="bg-[#101020] rounded-2xl p-3.5 border border-[#1a1a30] animate-slide-up"
              style={{ animationDelay: `${episodes.length * 0.05 + 0.05}s` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8b8aa0] font-body">
                  Total Episodes
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#f0eef5] font-body tabular-nums">
                    {episodes.length}
                  </span>
                  {episodes.some((e) => e.locked) && (
                    <span className="text-[10px] text-[#FFAB00] font-body">
                      {episodes.filter((e) => e.locked).length} premium
                    </span>
                  )}
                  {episodes.some((e) => e.video_url) && (
                    <span className="text-[10px] text-[#00D2FF] font-body">
                      {episodes.filter((e) => e.video_url).length} with video
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Back to drama button at bottom ── */}
        <div className="mt-6 animate-slide-up" style={{ animationDelay: "0.3s" }}>
          <button
            onClick={onBack}
            className="w-full py-3.5 rounded-xl bg-[#101020] border border-[#1a1a30] text-sm font-bold font-body text-[#8b8aa0] hover:text-[#f0eef5] transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Drama
          </button>
        </div>
      </div>

      {/* ── Delete confirm dialog ── */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Episode"
          message="This will permanently delete this episode. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
