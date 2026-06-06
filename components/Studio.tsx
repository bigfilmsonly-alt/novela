"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { GeneratedDrama } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Production pipeline steps (visual only — runs during API call)    */
/* ------------------------------------------------------------------ */
const PIPELINE_STEPS = [
  {
    label: "Developing premise...",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ),
  },
  {
    label: "Casting characters...",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    label: "Writing episodes...",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: "Setting cliffhangers...",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Inspiration premise cards                                         */
/* ------------------------------------------------------------------ */
const INSPIRATION_PROMPTS = [
  "A deepfake detective discovers her own face is the most counterfeited in the world",
  "Three strangers wake up in an escape room that turns out to be a real apartment in Tokyo",
  "A chef's AI sous-chef starts rewriting recipes that change anyone who eats the food",
  "An influencer's clone goes viral and starts living a better life than the original",
  "A retired astronaut opens a food truck on Mars, but her first customer is the AI that stranded her there",
  "Two rival K-pop trainees discover they're both being managed by the same rogue AI agent",
  "A sleep researcher enters patients' dreams and finds they all share the same recurring stranger",
  "A true-crime podcaster realizes the cold case she's investigating is her own future murder",
];

/* ------------------------------------------------------------------ */
/*  Confetti particle (gold dots that fly up briefly)                 */
/* ------------------------------------------------------------------ */
function ConfettiParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => {
        const left = 15 + Math.random() * 70;
        const delay = Math.random() * 0.4;
        const dur = 0.8 + Math.random() * 0.6;
        const size = 4 + Math.random() * 4;
        return (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${left}%`,
              bottom: "0%",
              width: size,
              height: size,
              background:
                i % 3 === 0
                  ? "#E9C682"
                  : i % 3 === 1
                  ? "#FF3D6E"
                  : "#34d399",
              opacity: 0,
              animation: `confetti-up ${dur}s ${delay}s ease-out forwards`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confetti-up {
          0% { opacity: 1; transform: translateY(0) scale(1) rotate(0deg); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-120px) scale(0.3) rotate(${180 + Math.random() * 180}deg); }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Circular progress ring (SVG)                                      */
/* ------------------------------------------------------------------ */
function CharCountRing({ count, max }: { count: number; max: number }) {
  const pct = Math.min(count / max, 1);
  const r = 10;
  const circ = 2 * Math.PI * r;
  const offset = circ - pct * circ;
  const color =
    pct > 0.9 ? "#FF3D6E" : pct > 0.7 ? "#E9C682" : "#9A93A6";

  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" className="-rotate-90">
        <circle cx="14" cy="14" r={r} fill="none" stroke="#1E1E2A" strokeWidth="2.5" />
        <circle
          cx="14"
          cy="14"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <span className="text-xs tabular-nums" style={{ color }}>
        {count}/{max}
      </span>
    </div>
  );
}

/* ================================================================== */
/*  STUDIO COMPONENT                                                  */
/* ================================================================== */
export default function Studio() {
  const [premise, setPremise] = useState("");
  const [loading, setLoading] = useState(false);
  const [drama, setDrama] = useState<GeneratedDrama | null>(null);
  const [sent, setSent] = useState(false);

  /* Production pipeline visual state */
  const [pipelineStep, setPipelineStep] = useState(0);
  const pipelineRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Expandable cold-open / cliffhanger per episode */
  const [expandedColdOpen, setExpandedColdOpen] = useState<Record<number, boolean>>({});
  const [expandedCliffhanger, setExpandedCliffhanger] = useState<Record<number, boolean>>({});

  /* Confetti trigger */
  const [showConfetti, setShowConfetti] = useState(false);

  /* Inspiration scroll container */
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Cleanup pipeline interval on unmount */
  useEffect(() => {
    return () => {
      if (pipelineRef.current) clearInterval(pipelineRef.current);
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Generate handler                                                */
  /* ---------------------------------------------------------------- */
  const generate = useCallback(async () => {
    if (!premise.trim() || loading) return;
    setLoading(true);
    setDrama(null);
    setSent(false);
    setShowConfetti(false);
    setPipelineStep(0);
    setExpandedColdOpen({});
    setExpandedCliffhanger({});

    /* Start the visual pipeline ticker */
    let step = 0;
    pipelineRef.current = setInterval(() => {
      step += 1;
      if (step < PIPELINE_STEPS.length) {
        setPipelineStep(step);
      } else {
        /* Hold on last step */
        if (pipelineRef.current) clearInterval(pipelineRef.current);
      }
    }, 1500);

    try {
      const res = await fetch("/api/generate-drama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ premise: premise.trim() }),
      });
      const data = await res.json();
      setDrama(data);
    } catch {
      setDrama({
        title: "Connection Lost",
        logline: "The AI is thinking... try again in a moment.",
        genre: "Demo",
        episodes: [],
      });
    }

    if (pipelineRef.current) clearInterval(pipelineRef.current);
    setPipelineStep(PIPELINE_STEPS.length); // all done
    setLoading(false);
  }, [premise, loading]);

  /* ---------------------------------------------------------------- */
  /*  Send to Filmology Floor                                         */
  /* ---------------------------------------------------------------- */
  const sendToFloor = () => {
    setSent(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1800);
    // TODO: POST to Supabase -- create draft drama + episodes
  };

  /* Toggle helpers */
  const toggleColdOpen = (i: number) =>
    setExpandedColdOpen((s) => ({ ...s, [i]: !s[i] }));
  const toggleCliffhanger = (i: number) =>
    setExpandedCliffhanger((s) => ({ ...s, [i]: !s[i] }));

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 pt-14 pb-28">
      <div className="max-w-md mx-auto">
        {/* -------------------------------------------------------- */}
        {/*  HEADER                                                   */}
        {/* -------------------------------------------------------- */}
        <div className="text-center mb-8 animate-rise">
          {/* Film camera icon + title */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <svg
              className="w-8 h-8 text-coral"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9.75a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Studio
            </h2>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-muted leading-relaxed">
            Type a premise. AI writes the series. Send it to the floor.
          </p>

          {/* Powered by Claude badge */}
          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-bg2 border border-bg3">
            <svg className="w-3.5 h-3.5 text-gold" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="text-[10px] font-bold text-muted tracking-wide uppercase">
              Powered by Claude
            </span>
          </div>
        </div>

        {/* -------------------------------------------------------- */}
        {/*  PREMISE INPUT                                            */}
        {/* -------------------------------------------------------- */}
        <div className="mb-6 animate-rise" style={{ animationDelay: "0.1s" }}>
          <div className="relative">
            <textarea
              value={premise}
              onChange={(e) => setPremise(e.target.value.slice(0, 500))}
              placeholder="An underground network of grandmothers secretly runs the city's most powerful AI startup from a bingo hall..."
              className="w-full h-36 bg-bg2 rounded-2xl p-5 text-ink text-sm font-body leading-relaxed placeholder:text-muted/40 resize-none focus:outline-none focus:ring-2 focus:ring-coral/30 focus:shadow-[inset_0_0_20px_rgba(255,61,110,0.06)] transition-all border border-transparent focus:border-coral/20"
              maxLength={500}
            />
          </div>

          <div className="flex justify-between items-center mt-3">
            <CharCountRing count={premise.length} max={500} />

            <button
              onClick={generate}
              disabled={loading || !premise.trim()}
              className="flex items-center gap-2.5 px-7 py-3 rounded-full bg-gradient-to-r from-coral to-gold text-bg font-bold text-sm tracking-wide transition-all hover:scale-[1.03] hover:shadow-[0_4px_24px_rgba(255,61,110,0.3)] active:scale-[0.97] disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              {/* Film clapper icon */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 10l2-3h2l-2 3h2l2-3h2l-2 3h2l2-3h2l-2 3h2v8H6V10z" />
              </svg>
              Generate Series
            </button>
          </div>
        </div>

        {/* -------------------------------------------------------- */}
        {/*  LOADING — THEATRICAL PRODUCTION PIPELINE                 */}
        {/* -------------------------------------------------------- */}
        {loading && (
          <div className="py-8 animate-fade-in">
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-bg2 rounded-full mb-8 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-coral to-gold transition-all duration-[1200ms] ease-out"
                style={{
                  width: `${((pipelineStep + 1) / PIPELINE_STEPS.length) * 100}%`,
                }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-4">
              {PIPELINE_STEPS.map((step, i) => {
                const isDone = pipelineStep > i;
                const isActive = pipelineStep === i;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3.5 transition-all duration-500 ${
                      isActive
                        ? "opacity-100"
                        : isDone
                        ? "opacity-60"
                        : "opacity-20"
                    }`}
                  >
                    {/* Status indicator */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                        isDone
                          ? "bg-emerald/20 text-emerald"
                          : isActive
                          ? "bg-coral/20 text-coral"
                          : "bg-bg2 text-muted/40"
                      }`}
                    >
                      {isDone ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : isActive ? (
                        <div className="w-4 h-4 border-2 border-coral/30 border-t-coral rounded-full animate-spin" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-muted/30" />
                      )}
                    </div>

                    {/* Icon + label */}
                    <div
                      className={`flex items-center gap-2 transition-colors duration-500 ${
                        isActive ? "text-ink" : isDone ? "text-ink/60" : "text-muted/40"
                      }`}
                    >
                      {step.icon}
                      <span className="text-sm font-medium">{step.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-muted/50 mt-6">
              4 episodes &middot; 90 seconds each &middot; vertical format
            </p>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/*  RESULT — CINEMATIC REVEAL                                */}
        {/* -------------------------------------------------------- */}
        {drama && !loading && (
          <div className="space-y-4 animate-fade-in">
            {/* ---- Series header card ---- */}
            <div className="bg-bg2 rounded-2xl p-6 border border-bg3 animate-slide-up">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {/* Genre pill */}
                  <span className="inline-block px-3 py-1 rounded-full bg-coral/15 text-coral text-[11px] font-bold tracking-widest uppercase mb-3">
                    {drama.genre}
                  </span>
                  {/* Title */}
                  <h3 className="font-display text-2xl font-bold leading-tight">
                    {drama.title}
                  </h3>
                </div>

                {/* AI Generated badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 shrink-0 ml-3">
                  <svg className="w-3.5 h-3.5 text-gold" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-[10px] font-bold text-gold whitespace-nowrap">
                    AI Generated
                  </span>
                </div>
              </div>

              {/* Logline */}
              <p className="text-sm text-ink/80 leading-relaxed italic">
                &ldquo;{drama.logline}&rdquo;
              </p>
            </div>

            {/* ---- Episode cards ---- */}
            {drama.episodes.map((ep, i) => (
              <div
                key={i}
                className="bg-bg2 rounded-2xl p-5 border border-bg3 animate-slide-up"
                style={{ animationDelay: `${(i + 1) * 0.12}s` }}
              >
                {/* Episode header row */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-coral/15 flex items-center justify-center text-coral font-display font-bold text-sm shrink-0">
                    {ep.episode_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-base leading-snug truncate">
                      {ep.title}
                    </h4>
                  </div>
                  <span className="text-[10px] text-muted font-medium tracking-wide shrink-0">
                    ~90 sec
                  </span>
                </div>

                {/* Synopsis */}
                <p className="text-sm text-ink/75 mb-3 leading-relaxed">
                  {ep.synopsis}
                </p>

                {/* Cold open (expandable) */}
                {ep.cold_open && (
                  <button
                    onClick={() => toggleColdOpen(i)}
                    className="w-full text-left mb-2 group"
                  >
                    <div
                      className={`rounded-xl overflow-hidden transition-all duration-300 ${
                        expandedColdOpen[i] ? "bg-bg3 p-3.5" : "bg-bg3/60 p-3"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-gold tracking-[0.15em] uppercase">
                          COLD OPEN
                        </span>
                        <svg
                          className={`w-3.5 h-3.5 text-gold/60 transition-transform duration-300 ${
                            expandedColdOpen[i] ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <div
                        className={`grid transition-all duration-300 ${
                          expandedColdOpen[i]
                            ? "grid-rows-[1fr] opacity-100 mt-2"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="text-xs text-ink/65 leading-relaxed">
                            {ep.cold_open}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                {/* Cliffhanger (expandable) */}
                {ep.cliffhanger && (
                  <button
                    onClick={() => toggleCliffhanger(i)}
                    className="w-full text-left group"
                  >
                    <div
                      className={`rounded-xl overflow-hidden transition-all duration-300 ${
                        expandedCliffhanger[i] ? "bg-bg3 p-3.5" : "bg-bg3/60 p-3"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-coral tracking-[0.15em] uppercase">
                          CLIFFHANGER
                        </span>
                        <svg
                          className={`w-3.5 h-3.5 text-coral/60 transition-transform duration-300 ${
                            expandedCliffhanger[i] ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <div
                        className={`grid transition-all duration-300 ${
                          expandedCliffhanger[i]
                            ? "grid-rows-[1fr] opacity-100 mt-2"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="text-xs text-ink/65 leading-relaxed">
                            {ep.cliffhanger}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            ))}

            {/* ---- Send to Filmology Floor ---- */}
            <div
              className="relative animate-slide-up"
              style={{ animationDelay: `${(drama.episodes.length + 1) * 0.12}s` }}
            >
              {showConfetti && <ConfettiParticles />}
              <button
                onClick={sendToFloor}
                disabled={sent}
                className={`relative w-full py-5 rounded-2xl font-bold text-base tracking-wide transition-all duration-500 overflow-hidden ${
                  sent
                    ? "bg-emerald/20 text-emerald border border-emerald/30"
                    : "bg-gradient-to-r from-gold via-coral to-gold text-bg hover:scale-[1.02] hover:shadow-[0_6px_32px_rgba(255,61,110,0.25)] active:scale-[0.98] border border-transparent"
                }`}
              >
                {sent ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Sent to Filmology Floor
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2.5">
                    {/* Paper plane icon */}
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                    Send to Filmology Floor
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/*  INSPIRATION PROMPTS (horizontal scroll)                  */}
        {/* -------------------------------------------------------- */}
        {!drama && !loading && (
          <div className="animate-rise" style={{ animationDelay: "0.2s" }}>
            <p className="text-xs text-muted mb-3 uppercase tracking-[0.15em] font-bold">
              Need inspiration?
            </p>
            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 snap-x snap-mandatory"
            >
              {INSPIRATION_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPremise(p)}
                  className="snap-start shrink-0 w-56 text-left rounded-2xl p-4 text-xs text-ink/70 leading-relaxed hover:text-ink transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-bg3 hover:border-coral/30"
                  style={{
                    background:
                      i % 4 === 0
                        ? "linear-gradient(135deg, #14141C 0%, #1a1424 100%)"
                        : i % 4 === 1
                        ? "linear-gradient(135deg, #14141C 0%, #1c1420 100%)"
                        : i % 4 === 2
                        ? "linear-gradient(135deg, #14141C 0%, #141c1e 100%)"
                        : "linear-gradient(135deg, #14141C 0%, #1c1a14 100%)",
                  }}
                >
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-3.5 h-3.5 text-coral/50 mt-0.5 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    <span>{p}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
