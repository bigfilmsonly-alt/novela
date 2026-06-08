"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface EpisodeData {
  id: string;
  episode_number: number;
  title: string;
  synopsis: string;
  video_url: string | null;
  poster_url: string | null;
  duration_sec: number | null;
  locked: boolean;
  price_cents: number;
}

interface EpisodeEditorProps {
  dramaId: string;
  dramaTitle: string;
  onBack: () => void;
}

export default function EpisodeEditor({ dramaId, dramaTitle, onBack }: EpisodeEditorProps) {
  const [episodes, setEpisodes] = useState<EpisodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSynopsis, setEditSynopsis] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch episodes
  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        const supabase = createClient();
        if (!supabase) {
          setLoading(false);
          return;
        }
        const { data } = await supabase
          .from("episodes")
          .select("*")
          .eq("drama_id", dramaId)
          .order("episode_number");
        if (data) setEpisodes(data);
      } catch {
        // Graceful fallback
      }
      setLoading(false);
    };
    fetchEpisodes();
  }, [dramaId]);

  const startEditing = useCallback((ep: EpisodeData) => {
    setEditingId(ep.id);
    setEditTitle(ep.title);
    setEditSynopsis(ep.synopsis);
    setEditPrice((ep.price_cents / 100).toFixed(2));
  }, []);

  const saveEpisode = useCallback(async () => {
    if (!editingId || saving) return;
    setSaving(true);
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase
          .from("episodes")
          .update({
            title: editTitle,
            synopsis: editSynopsis,
            price_cents: Math.round(parseFloat(editPrice || "0") * 100),
          })
          .eq("id", editingId);

        setEpisodes((prev) =>
          prev.map((ep) =>
            ep.id === editingId
              ? {
                  ...ep,
                  title: editTitle,
                  synopsis: editSynopsis,
                  price_cents: Math.round(parseFloat(editPrice || "0") * 100),
                }
              : ep
          )
        );
      }
    } catch {
      // Graceful
    }
    setEditingId(null);
    setSaving(false);
  }, [editingId, editTitle, editSynopsis, editPrice, saving]);

  const addEpisode = useCallback(async () => {
    try {
      const supabase = createClient();
      if (!supabase) return;
      const nextNumber = episodes.length + 1;
      const { data } = await supabase
        .from("episodes")
        .insert({
          drama_id: dramaId,
          episode_number: nextNumber,
          title: `Episode ${nextNumber}`,
          synopsis: "",
          locked: nextNumber > 2,
          price_cents: nextNumber > 2 ? 499 : 0,
        })
        .select()
        .single();
      if (data) {
        setEpisodes((prev) => [...prev, data]);
        startEditing(data);
      }
    } catch {
      // Graceful
    }
  }, [dramaId, episodes.length, startEditing]);

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 pt-14 pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 animate-rise">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#101020] border border-[#1a1a30] flex items-center justify-center hover:border-[#6C5CE7]/30 transition-colors"
          >
            <svg className="w-4 h-4 text-[#f0eef5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-bold tracking-tight truncate">
              Episodes
            </h2>
            <p className="text-xs text-[#8b8aa0] font-body truncate">
              {dramaTitle}
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#6C5CE7]/20 border-t-[#6C5CE7] rounded-full animate-spin" />
          </div>
        )}

        {/* No episodes */}
        {!loading && episodes.length === 0 && (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#101020] border border-[#1a1a30] flex items-center justify-center">
              <svg className="w-7 h-7 text-[#8b8aa0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" />
              </svg>
            </div>
            <p className="text-sm text-[#8b8aa0] font-body mb-4">
              No episodes yet
            </p>
            <button
              onClick={addEpisode}
              className="px-6 py-3 rounded-xl bg-[#6C5CE7] text-white font-bold text-sm font-body transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Add First Episode
            </button>
          </div>
        )}

        {/* Episode list */}
        {!loading && episodes.length > 0 && (
          <div className="space-y-3">
            {episodes.map((ep) => (
              <div
                key={ep.id}
                className="bg-[#101020] rounded-2xl border border-[#1a1a30] overflow-hidden animate-slide-up"
              >
                {editingId === ep.id ? (
                  /* Editing mode */
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-[#6C5CE7]/15 flex items-center justify-center text-[#6C5CE7] font-bold text-xs">
                        {ep.episode_number}
                      </div>
                      <span className="text-[10px] text-[#8b8aa0] uppercase tracking-wider font-bold">
                        Editing
                      </span>
                    </div>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Episode title"
                      className="w-full bg-[#1a1a30] rounded-xl p-3 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 focus:outline-none focus:ring-1 focus:ring-[#6C5CE7]/40 border border-[#1a1a30]"
                    />
                    <textarea
                      value={editSynopsis}
                      onChange={(e) => setEditSynopsis(e.target.value)}
                      placeholder="Episode synopsis..."
                      rows={3}
                      className="w-full bg-[#1a1a30] rounded-xl p-3 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 focus:outline-none focus:ring-1 focus:ring-[#6C5CE7]/40 border border-[#1a1a30] resize-none"
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-[#8b8aa0] uppercase tracking-wider font-bold mb-1 block">
                          Price
                        </label>
                        <input
                          type="text"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-[#1a1a30] rounded-lg p-2.5 text-sm text-[#f0eef5] font-body focus:outline-none focus:ring-1 focus:ring-[#6C5CE7]/40 border border-[#1a1a30]"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-2.5 rounded-xl bg-[#1a1a30] text-[#8b8aa0] text-xs font-bold font-body"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEpisode}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-xl bg-[#6C5CE7] text-white text-xs font-bold font-body disabled:opacity-50"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <button
                    onClick={() => startEditing(ep)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/10 flex items-center justify-center text-[#6C5CE7] font-bold text-sm flex-shrink-0">
                        {ep.episode_number}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-[#f0eef5] font-body truncate">
                          {ep.title}
                        </h4>
                        {ep.synopsis && (
                          <p className="text-[11px] text-[#8b8aa0] font-body line-clamp-1 mt-0.5">
                            {ep.synopsis}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {ep.locked ? (
                          <span className="text-[10px] font-bold text-[#FFAB00] font-body">
                            ${(ep.price_cents / 100).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-[#00D2FF] font-body">
                            Free
                          </span>
                        )}
                      </div>
                      <svg className="w-4 h-4 text-[#8b8aa0]/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </button>
                )}
              </div>
            ))}

            {/* Add episode */}
            <button
              onClick={addEpisode}
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-[#1a1a30] text-sm font-body font-medium text-[#8b8aa0] hover:text-[#f0eef5] hover:border-[#6C5CE7]/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Episode
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
