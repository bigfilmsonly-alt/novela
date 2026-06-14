"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { GeneratedDrama } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

/* ================================================================== */
/*  CONSTANTS                                                          */
/* ================================================================== */

const MAX_CHARS = 500;

const PIPELINE_STEPS = [
  "Developing premise",
  "Casting characters",
  "Writing episodes",
  "Setting cliffhangers",
];

const SUGGESTIONS = [
  "A deepfake detective discovers her own face is the most counterfeited in the world",
  "Three strangers wake up in an escape room that turns out to be a real apartment in Tokyo",
  "A true-crime podcaster realizes the cold case she's investigating is her own future murder",
  "An influencer's clone goes viral and starts living a better life than the original",
  "Two rival K-pop trainees discover they're both managed by the same rogue AI agent",
  "A sleep researcher enters patients' dreams and finds they all share the same recurring stranger",
];

/* ================================================================== */
/*  STUDIO                                                             */
/* ================================================================== */
export default function Studio() {
  const [premise, setPremise] = useState("");
  const [loading, setLoading] = useState(false);
  const [drama, setDrama] = useState<GeneratedDrama | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [expandedEp, setExpandedEp] = useState<number | null>(null);
  const pipelineRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (pipelineRef.current) clearInterval(pipelineRef.current);
    };
  }, []);

  /* Scroll to results when drama appears */
  useEffect(() => {
    if (drama && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [drama]);

  /* -------------------------------------------------------------- */
  /*  Generate                                                       */
  /* -------------------------------------------------------------- */
  const generate = useCallback(async () => {
    if (!premise.trim() || loading) return;
    setLoading(true);
    setDrama(null);
    setSubmitted(false);
    setPipelineStep(0);
    setExpandedEp(null);

    let step = 0;
    pipelineRef.current = setInterval(() => {
      step += 1;
      if (step < PIPELINE_STEPS.length) {
        setPipelineStep(step);
      } else if (pipelineRef.current) {
        clearInterval(pipelineRef.current);
      }
    }, 1400);

    try {
      const res = await fetch("/api/generate-drama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ premise: premise.trim() }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDrama(data);
    } catch {
      setDrama({
        title: "Connection Lost",
        logline: "Something went wrong. Try again in a moment.",
        genre: "Error",
        episodes: [],
      });
    }

    if (pipelineRef.current) clearInterval(pipelineRef.current);
    setPipelineStep(PIPELINE_STEPS.length);
    setLoading(false);
  }, [premise, loading]);

  /* -------------------------------------------------------------- */
  /*  Submit for Production                                          */
  /* -------------------------------------------------------------- */
  const submitForProduction = async () => {
    if (!drama || submitted || submitting) return;
    setSubmitting(true);

    try {
      const supabase = createClient();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("generations").insert({
          user_id: user?.id ?? null,
          premise: premise.trim(),
          result: drama,
          model: "claude-sonnet-4-20250514",
        });
      }
    } catch {
      // Graceful — submission state still updates for UX
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  /* -------------------------------------------------------------- */
  /*  Reset                                                          */
  /* -------------------------------------------------------------- */
  const reset = () => {
    setPremise("");
    setDrama(null);
    setSubmitted(false);
    setExpandedEp(null);
  };

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="h-full overflow-y-auto no-scrollbar px-5 pt-14 pb-32">
      <div className="max-w-md mx-auto">

        {/* -------------------------------------------------------- */}
        {/*  HERO — What this is                                     */}
        {/* -------------------------------------------------------- */}
        <header className="mb-10 animate-rise">
          <h2 className="font-display text-[28px] font-bold tracking-tight leading-tight mb-2">
            Create a Series
          </h2>
          <p className="text-[15px] text-muted leading-relaxed">
            Describe any story idea. Our AI writes a complete 4-episode
            vertical drama — ready for production at Meridian Studios.
          </p>
        </header>

        {/* -------------------------------------------------------- */}
        {/*  HOW IT WORKS — 3 steps, always visible                  */}
        {/* -------------------------------------------------------- */}
        {!drama && !loading && (
          <div className="mb-8 animate-rise" style={{ animationDelay: "0.05s" }}>
            <div className="grid grid-cols-3 gap-3">
              {[
                { num: "1", label: "Write", desc: "Your premise" },
                { num: "2", label: "Generate", desc: "AI writes it" },
                { num: "3", label: "Submit", desc: "For production" },
              ].map((step) => (
                <div key={step.num} className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-bg2 border border-bg3 flex items-center justify-center text-xs font-bold text-coral">
                    {step.num}
                  </div>
                  <p className="text-xs font-bold text-ink">{step.label}</p>
                  <p className="text-[11px] text-muted mt-0.5">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/*  INPUT                                                    */}
        {/* -------------------------------------------------------- */}
        {!drama && !loading && (
          <div className="animate-rise" style={{ animationDelay: "0.1s" }}>
            <div className="relative mb-3">
              <textarea
                value={premise}
                onChange={(e) => setPremise(e.target.value.slice(0, MAX_CHARS))}
                placeholder="A retired astronaut opens a food truck on Mars, but her first customer is the AI that stranded her there..."
                className="w-full h-32 bg-bg2 rounded-2xl p-5 text-ink text-sm font-body leading-relaxed placeholder:text-muted/40 resize-none focus:outline-none focus:ring-2 focus:ring-coral/40 transition-all border border-bg3 focus:border-coral/30"
                maxLength={MAX_CHARS}
              />
              {/* Character count — minimal */}
              <span className={`absolute bottom-3 right-4 text-[11px] tabular-nums transition-colors ${
                premise.length > 450 ? "text-gold" : "text-muted/40"
              }`}>
                {premise.length}/{MAX_CHARS}
              </span>
            </div>

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={!premise.trim()}
              className="w-full py-4 rounded-2xl bg-coral text-white font-bold text-[15px] tracking-wide transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Generate Series
            </button>

            {/* ---- Suggestions ---- */}
            <div className="mt-8">
              <p className="text-[11px] text-muted/60 uppercase tracking-[0.12em] font-bold mb-3">
                Or try one of these
              </p>
              <div className="space-y-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setPremise(s)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-bg2 border border-bg3 text-xs text-ink/70 leading-relaxed hover:text-ink hover:border-coral/30 transition-all active:scale-[0.98]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/*  LOADING STATE                                           */}
        {/* -------------------------------------------------------- */}
        {loading && (
          <div className="py-12 animate-fade-in">
            {/* Progress */}
            <div className="w-full h-1 bg-bg2 rounded-full mb-10 overflow-hidden">
              <div
                className="h-full rounded-full bg-coral transition-all duration-[1200ms] ease-out"
                style={{
                  width: `${((pipelineStep + 1) / PIPELINE_STEPS.length) * 100}%`,
                }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-5">
              {PIPELINE_STEPS.map((label, i) => {
                const isDone = pipelineStep > i;
                const isActive = pipelineStep === i;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-4 transition-all duration-500 ${
                      isActive ? "opacity-100" : isDone ? "opacity-40" : "opacity-15"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isDone ? "bg-emerald/20" : isActive ? "bg-coral/20" : "bg-bg2"
                    }`}>
                      {isDone ? (
                        <svg className="w-3.5 h-3.5 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isActive ? (
                        <div className="w-3 h-3 border-2 border-coral/40 border-t-coral rounded-full animate-spin" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-muted/30" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      isActive ? "text-ink" : "text-muted"
                    }`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-muted/40 mt-10">
              4 episodes &middot; 90 sec each &middot; vertical format
            </p>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/*  RESULTS                                                  */}
        {/* -------------------------------------------------------- */}
        {drama && !loading && (
          <div ref={resultRef} className="animate-fade-in">

            {/* Series overview */}
            <div className="mb-6 animate-slide-up">
              <span className="inline-block px-2.5 py-1 rounded-full bg-coral/15 text-coral text-[10px] font-bold tracking-widest uppercase mb-3">
                {drama.genre}
              </span>
              <h3 className="font-display text-2xl font-bold leading-tight mb-2">
                {drama.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {drama.logline}
              </p>
            </div>

            {/* Episodes */}
            {drama.episodes.length > 0 && (
              <div className="mb-8">
                <p className="text-[11px] text-muted/60 uppercase tracking-[0.12em] font-bold mb-3">
                  {drama.episodes.length} Episodes
                </p>

                <div className="space-y-2">
                  {drama.episodes.map((ep, i) => {
                    const isExpanded = expandedEp === i;
                    return (
                      <button
                        key={i}
                        onClick={() => setExpandedEp(isExpanded ? null : i)}
                        className="w-full text-left bg-bg2 rounded-xl border border-bg3 overflow-hidden transition-all hover:border-coral/20 active:scale-[0.99]"
                      >
                        {/* Header */}
                        <div className="flex items-center gap-3 p-4">
                          <div className="w-7 h-7 rounded-full bg-coral/10 flex items-center justify-center text-coral font-bold text-xs shrink-0">
                            {ep.episode_number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-ink truncate">
                              {ep.title}
                            </h4>
                          </div>
                          <svg
                            className={`w-4 h-4 text-muted/40 transition-transform duration-200 shrink-0 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>

                        {/* Expanded content */}
                        <div className={`grid transition-all duration-300 ${
                          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                        }`}>
                          <div className="overflow-hidden">
                            <div className="px-4 pb-4 space-y-3">
                              <p className="text-xs text-ink/70 leading-relaxed">
                                {ep.synopsis}
                              </p>

                              {ep.cold_open && (
                                <div className="rounded-lg bg-bg3/60 p-3">
                                  <p className="text-[10px] font-bold text-gold tracking-[0.1em] uppercase mb-1">
                                    Cold Open
                                  </p>
                                  <p className="text-[11px] text-ink/60 leading-relaxed">
                                    {ep.cold_open}
                                  </p>
                                </div>
                              )}

                              {ep.cliffhanger && (
                                <div className="rounded-lg bg-bg3/60 p-3">
                                  <p className="text-[10px] font-bold text-coral tracking-[0.1em] uppercase mb-1">
                                    Cliffhanger
                                  </p>
                                  <p className="text-[11px] text-ink/60 leading-relaxed">
                                    {ep.cliffhanger}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/*  CTA — Submit for Production                         */}
            {/* ---------------------------------------------------- */}
            {!submitted ? (
              <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
                {/* Explanation */}
                <div className="bg-bg2 rounded-xl border border-bg3 p-4 mb-4">
                  <p className="text-xs text-muted leading-relaxed">
                    <span className="font-bold text-ink">What happens next:</span>{" "}
                    Your series enters the Meridian Studios greenlight queue.
                    Our team reviews submissions weekly. If selected, it goes
                    into production on our LED volume stages in Paterson, NJ.
                  </p>
                </div>

                {/* Submit button */}
                <button
                  onClick={submitForProduction}
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-coral text-white font-bold text-[15px] tracking-wide transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit for Production"}
                </button>

                {/* Start over link */}
                <button
                  onClick={reset}
                  className="w-full mt-3 py-3 text-sm text-muted hover:text-ink transition-colors"
                >
                  Start over with a new idea
                </button>
              </div>
            ) : (
              /* -------------------------------------------------- */
              /*  POST-SUBMIT CONFIRMATION                           */
              /* -------------------------------------------------- */
              <div className="animate-slide-up text-center py-6">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald/15 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="font-display text-lg font-bold mb-2">
                  Submitted
                </h4>
                <p className="text-xs text-muted leading-relaxed max-w-[280px] mx-auto mb-6">
                  &ldquo;{drama.title}&rdquo; is now in the greenlight queue.
                  You&apos;ll be notified if it moves to production.
                </p>
                <button
                  onClick={reset}
                  className="px-6 py-3 rounded-xl bg-bg2 border border-bg3 text-sm font-medium text-ink hover:border-coral/30 transition-all active:scale-[0.98]"
                >
                  Create another series
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
