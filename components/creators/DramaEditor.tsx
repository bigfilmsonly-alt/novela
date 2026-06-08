"use client";

import { useState, useEffect, useCallback } from "react";
import type { Drama } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface DramaEditorProps {
  channelId: string;
  dramaId?: string;
  onBack: () => void;
  onSaved: (dramaId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const GENRES = [
  "Romance",
  "Thriller",
  "Comedy",
  "Drama",
  "Sci-Fi",
  "Mystery",
  "Horror",
  "Action",
  "Sports",
  "Music",
  "Fantasy",
  "Crime",
];

const GRADIENT_PRESETS = [
  { label: "Purple Night", value: "from-purple-900 to-black", from: "#581c87", to: "#000000" },
  { label: "Coral Fire", value: "from-red-800 to-orange-900", from: "#991b1b", to: "#7c2d12" },
  { label: "Ocean Deep", value: "from-blue-900 to-cyan-900", from: "#1e3a5f", to: "#164e63" },
  { label: "Emerald Mist", value: "from-emerald-900 to-teal-900", from: "#064e3b", to: "#134e4a" },
  { label: "Golden Hour", value: "from-amber-800 to-yellow-900", from: "#92400e", to: "#713f12" },
  { label: "Midnight Violet", value: "from-violet-900 to-indigo-950", from: "#4c1d95", to: "#1e1b4b" },
  { label: "Crimson Noir", value: "from-rose-900 to-slate-950", from: "#881337", to: "#020617" },
  { label: "Storm Gray", value: "from-gray-800 to-slate-900", from: "#1f2937", to: "#0f172a" },
];

/* ------------------------------------------------------------------ */
/*  Form state type                                                    */
/* ------------------------------------------------------------------ */
interface FormState {
  title: string;
  logline: string;
  genre: string;
  poster_url: string;
  poster_gradient: string;
  total_episodes: number;
}

const INITIAL_FORM: FormState = {
  title: "",
  logline: "",
  genre: "",
  poster_url: "",
  poster_gradient: GRADIENT_PRESETS[0].value,
  total_episodes: 4,
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function DramaEditor({
  channelId,
  dramaId,
  onBack,
  onSaved,
}: DramaEditorProps) {
  const isEditing = Boolean(dramaId);

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  /* ── Fetch existing drama for editing ── */
  useEffect(() => {
    if (!dramaId) return;
    setFetching(true);
    setError(null);

    fetch(`/api/creator/dramas/${dramaId}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Failed to load drama (${res.status})`);
        }
        return res.json();
      })
      .then((drama: Drama) => {
        setForm({
          title: drama.title || "",
          logline: drama.logline || "",
          genre: drama.genre || "",
          poster_url: drama.poster_url || "",
          poster_gradient: drama.poster_gradient || GRADIENT_PRESETS[0].value,
          total_episodes: drama.total_episodes || 4,
        });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load drama");
      })
      .finally(() => {
        setFetching(false);
      });
  }, [dramaId]);

  /* ── Form helpers ── */
  const updateField = useCallback(
    <K extends keyof FormState>(field: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  /* ── Validate ── */
  const validate = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) {
      errors.title = "Title is required";
    }
    if (!form.logline.trim()) {
      errors.logline = "Logline is required";
    } else if (form.logline.length > 200) {
      errors.logline = "Logline must be under 200 characters";
    }
    if (!form.genre) {
      errors.genre = "Please select a genre";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  /* ── Save ── */
  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setSaving(true);
    setError(null);
    try {
      const url = isEditing
        ? `/api/creator/dramas/${dramaId}`
        : "/api/creator/dramas";
      const method = isEditing ? "PUT" : "POST";

      const body = {
        title: form.title.trim(),
        logline: form.logline.trim(),
        genre: form.genre,
        poster_url: form.poster_url.trim() || null,
        poster_gradient: form.poster_gradient,
        total_episodes: form.total_episodes,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to save drama (${res.status})`);
      }

      const saved = await res.json();
      onSaved(saved.id || dramaId || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save drama");
    } finally {
      setSaving(false);
    }
  }, [form, isEditing, dramaId, validate, onSaved]);

  /* ── Currently selected gradient colors (for preview) ── */
  const selectedGradient =
    GRADIENT_PRESETS.find((g) => g.value === form.poster_gradient) ||
    GRADIENT_PRESETS[0];

  /* ── Loading skeleton while fetching ── */
  if (fetching) {
    return (
      <div className="h-full overflow-y-auto no-scrollbar px-4 pt-14 pb-24">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6 animate-rise">
            <div className="w-9 h-9 rounded-xl bg-[#1a1a30] animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-[#1a1a30] rounded-lg w-40 animate-pulse" />
              <div className="h-3 bg-[#1a1a30] rounded-lg w-24 animate-pulse" />
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-[#1a1a30] rounded w-20 animate-pulse" />
                <div className="h-12 bg-[#1a1a30] rounded-xl animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
              {isEditing ? "Edit Drama" : "New Drama"}
            </h2>
            <p className="text-xs text-[#8b8aa0] font-body">
              {isEditing ? "Update your drama series" : "Create a new drama series"}
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

        {/* ── Form ── */}
        <div className="space-y-5">
          {/* Title */}
          <div className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
            <label className="block text-xs text-[#8b8aa0] font-body font-semibold uppercase tracking-wider mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="The Inheritance Game"
              className={`w-full bg-[#1a1a30] rounded-xl p-3.5 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 focus:outline-none focus:ring-2 transition-all ${
                validationErrors.title
                  ? "ring-2 ring-red-500/50 focus:ring-red-500/50"
                  : "focus:ring-[#6C5CE7]/50"
              }`}
            />
            {validationErrors.title && (
              <p className="text-[11px] text-red-400 font-body mt-1">{validationErrors.title}</p>
            )}
          </div>

          {/* Logline */}
          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-[#8b8aa0] font-body font-semibold uppercase tracking-wider">
                Logline <span className="text-red-400">*</span>
              </label>
              <span
                className={`text-[10px] font-body font-medium tabular-nums ${
                  form.logline.length > 200
                    ? "text-red-400"
                    : form.logline.length > 160
                    ? "text-[#FFAB00]"
                    : "text-[#8b8aa0]"
                }`}
              >
                {form.logline.length}/200
              </span>
            </div>
            <textarea
              value={form.logline}
              onChange={(e) => updateField("logline", e.target.value)}
              placeholder="A gripping story about..."
              rows={3}
              className={`w-full bg-[#1a1a30] rounded-xl p-3.5 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 resize-none focus:outline-none focus:ring-2 transition-all ${
                validationErrors.logline
                  ? "ring-2 ring-red-500/50 focus:ring-red-500/50"
                  : "focus:ring-[#6C5CE7]/50"
              }`}
            />
            {validationErrors.logline && (
              <p className="text-[11px] text-red-400 font-body mt-1">{validationErrors.logline}</p>
            )}
          </div>

          {/* Genre pills */}
          <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <label className="block text-xs text-[#8b8aa0] font-body font-semibold uppercase tracking-wider mb-2">
              Genre <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => updateField("genre", g)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold font-body transition-all active:scale-95 ${
                    form.genre === g
                      ? "bg-[#6C5CE7] text-white shadow-lg shadow-[#6C5CE7]/20"
                      : "bg-[#1a1a30] text-[#8b8aa0] hover:text-[#f0eef5] hover:bg-[#1a1a30]/80"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            {validationErrors.genre && (
              <p className="text-[11px] text-red-400 font-body mt-1.5">{validationErrors.genre}</p>
            )}
          </div>

          {/* Poster URL */}
          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <label className="block text-xs text-[#8b8aa0] font-body font-semibold uppercase tracking-wider mb-1.5">
              Poster URL
            </label>
            <input
              type="url"
              value={form.poster_url}
              onChange={(e) => updateField("poster_url", e.target.value)}
              placeholder="https://example.com/poster.jpg"
              className="w-full bg-[#1a1a30] rounded-xl p-3.5 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 transition-all"
            />
            {/* Poster preview */}
            {form.poster_url && (
              <div className="mt-3 flex items-center gap-3">
                <div className="w-14 h-20 rounded-lg overflow-hidden bg-[#1a1a30] border border-[#2a2a40] flex-shrink-0">
                  <img
                    src={form.poster_url}
                    alt="Poster preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
                <p className="text-[10px] text-[#8b8aa0] font-body">Poster preview</p>
              </div>
            )}
          </div>

          {/* Poster gradient */}
          <div className="animate-slide-up" style={{ animationDelay: "0.25s" }}>
            <label className="block text-xs text-[#8b8aa0] font-body font-semibold uppercase tracking-wider mb-2">
              Poster Gradient
            </label>
            <p className="text-[10px] text-[#8b8aa0]/70 font-body mb-2.5">
              Used as fallback when no poster image is set
            </p>
            <div className="grid grid-cols-4 gap-2.5">
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => updateField("poster_gradient", g.value)}
                  className={`relative h-14 rounded-xl overflow-hidden transition-all active:scale-95 ${
                    form.poster_gradient === g.value
                      ? "ring-2 ring-[#6C5CE7] ring-offset-2 ring-offset-[#07070e] scale-105"
                      : "ring-1 ring-[#1a1a30] hover:ring-[#2a2a40]"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
                  }}
                  title={g.label}
                >
                  {form.poster_gradient === g.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white drop-shadow-lg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#8b8aa0]/50 font-body mt-1.5">
              {selectedGradient.label}
            </p>
          </div>

          {/* Total episodes */}
          <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <label className="block text-xs text-[#8b8aa0] font-body font-semibold uppercase tracking-wider mb-1.5">
              Total Episodes
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  updateField(
                    "total_episodes",
                    Math.max(1, form.total_episodes - 1)
                  )
                }
                className="w-10 h-10 rounded-xl bg-[#1a1a30] flex items-center justify-center text-[#f0eef5] hover:bg-[#2a2a40] transition-colors active:scale-90"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
              </button>
              <input
                type="number"
                min={1}
                max={20}
                value={form.total_episodes}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    updateField("total_episodes", Math.min(20, Math.max(1, val)));
                  }
                }}
                className="w-16 bg-[#1a1a30] rounded-xl p-3 text-center text-sm text-[#f0eef5] font-body font-bold focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 transition-all tabular-nums"
              />
              <button
                type="button"
                onClick={() =>
                  updateField(
                    "total_episodes",
                    Math.min(20, form.total_episodes + 1)
                  )
                }
                className="w-10 h-10 rounded-xl bg-[#1a1a30] flex items-center justify-center text-[#f0eef5] hover:bg-[#2a2a40] transition-colors active:scale-90"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <span className="text-xs text-[#8b8aa0] font-body ml-1">
                episodes (1-20)
              </span>
            </div>
          </div>

          {/* ── Preview card ── */}
          <div className="animate-slide-up" style={{ animationDelay: "0.35s" }}>
            <label className="block text-xs text-[#8b8aa0] font-body font-semibold uppercase tracking-wider mb-2">
              Preview
            </label>
            <div className="bg-[#101020] rounded-2xl p-4 border border-[#1a1a30]">
              <div className="flex gap-3.5">
                <div className="w-16 h-24 rounded-xl overflow-hidden bg-[#1a1a30] flex-shrink-0">
                  {form.poster_url ? (
                    <img
                      src={form.poster_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${selectedGradient.from}, ${selectedGradient.to})`,
                      }}
                    >
                      <svg
                        className="w-5 h-5 text-white/30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-body font-semibold text-sm text-[#f0eef5] truncate">
                    {form.title || "Untitled Drama"}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 mb-1.5">
                    <span className="text-[10px] text-[#6C5CE7] font-bold font-body uppercase">
                      {form.genre || "Genre"}
                    </span>
                    <span className="text-[10px] text-[#8b8aa0] font-body">
                      {form.total_episodes} eps
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8b8aa0] font-body line-clamp-2">
                    {form.logline || "Your logline will appear here..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex gap-3 mt-8 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          <button
            onClick={onBack}
            className="flex-1 py-4 rounded-2xl bg-[#101020] border border-[#1a1a30] text-sm font-bold font-body text-[#8b8aa0] hover:text-[#f0eef5] transition-colors active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#FFAB00] text-[#07070e] text-sm font-bold font-body hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {isEditing ? "Save Changes" : "Create Drama"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
