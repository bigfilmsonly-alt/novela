"use client";

import { useState, useCallback } from "react";
import type { HostSegment } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Segment metadata                                                   */
/* ------------------------------------------------------------------ */
const SEGMENT_META: {
  key: keyof HostSegment;
  label: string;
  borderColor: string;
  iconColor: string;
  icon: string;
}[] = [
  {
    key: "greeting",
    label: "WELCOME",
    borderColor: "border-l-coral",
    iconColor: "text-coral",
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  },
  {
    key: "recap",
    label: "THIS WEEK",
    borderColor: "border-l-gold",
    iconColor: "text-gold",
    icon: "M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z",
  },
  {
    key: "trending",
    label: "TRENDING",
    borderColor: "border-l-emerald",
    iconColor: "text-emerald",
    icon: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z",
  },
  {
    key: "recommendation",
    label: "FOR YOU",
    borderColor: "border-l-coral",
    iconColor: "text-coral",
    icon: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  },
  {
    key: "signoff",
    label: "SIGN OFF",
    borderColor: "border-l-muted",
    iconColor: "text-muted",
    icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",
  },
];

/* ------------------------------------------------------------------ */
/*  Waveform bar sub-component (CSS-animated)                          */
/* ------------------------------------------------------------------ */
function WaveformBars({
  count = 5,
  barClass = "bg-gradient-to-t from-coral to-gold",
  height = "h-8",
}: {
  count?: number;
  barClass?: string;
  height?: string;
}) {
  const delays = [0, 0.15, 0.3, 0.12, 0.25];
  return (
    <div className={`flex items-end justify-center gap-[3px] ${height}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`w-[3px] rounded-full ${barClass}`}
          style={{
            animation: `waveform 0.8s ease-in-out ${delays[i % delays.length]}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini EQ bars for the play button                                   */
/* ------------------------------------------------------------------ */
function EqBars() {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[0, 0.1, 0.2, 0.15].map((d, i) => (
        <div
          key={i}
          className="w-[3px] bg-coral rounded-full animate-eq"
          style={{ animationDelay: `${d}s` }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Floating audio visualizer (shown while TTS is speaking)            */
/* ------------------------------------------------------------------ */
function FloatingVisualizer() {
  return (
    <div
      className="flex items-center justify-center gap-3 py-3 px-5 rounded-2xl bg-bg3/80 backdrop-blur-md mb-4 animate-fade-in"
      style={{ animation: "fade-in 0.3s ease-out both, float-visualizer 2s ease-in-out infinite" }}
    >
      <div className="flex items-end gap-[2px] h-5">
        {[0, 0.08, 0.16, 0.24, 0.1, 0.18, 0.06].map((d, i) => (
          <div
            key={i}
            className="w-[2px] rounded-full bg-gradient-to-t from-coral to-gold"
            style={{
              animation: `waveform 0.6s ease-in-out ${d}s infinite alternate`,
            }}
          />
        ))}
      </div>
      <span className="text-xs font-body text-muted tracking-wide">LIVE</span>
      <div className="w-2 h-2 rounded-full bg-coral animate-pulse-glow" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card sub-component                                            */
/* ------------------------------------------------------------------ */
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 bg-bg2 rounded-xl py-3 px-2 text-center">
      <div className="font-display text-sm font-bold text-ink">{value}</div>
      <div className="text-[10px] text-muted mt-0.5 tracking-wide">{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function AIHost() {
  const [segment, setSegment] = useState<HostSegment | null>(null);
  const [loading, setLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  /* ---------- Generate show ---------------------------------------- */
  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-host", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: "" }),
      });
      const data = await res.json();
      setSegment(data);
    } catch {
      setSegment({
        greeting: "Hey -- welcome to Versa TV.",
        recap: "We had a packed week. Three new series dropped and the studio is buzzing.",
        trending: "'The Algorithm' finale pulled 48K views in 24 hours.",
        recommendation: "Start with 'Vertical Limit' if you haven't yet. Trust me.",
        signoff: "See you tomorrow night. Keep swiping.",
      });
    }
    setLoading(false);
  }, []);

  /* ---------- Speak (TTS) ------------------------------------------ */
  const speak = useCallback(() => {
    if (!segment || !window.speechSynthesis) return;
    const text = `${segment.greeting} ${segment.recap} ${segment.trending} ${segment.recommendation} ${segment.signoff}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [segment]);

  /* ---------- Share ------------------------------------------------- */
  const shareBriefing = useCallback(async () => {
    if (!segment) return;
    const text = [
      segment.greeting,
      segment.recap,
      segment.trending,
      segment.recommendation,
      segment.signoff,
    ].join("\n\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: "Versa TV Daily Briefing", text });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  }, [segment]);

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */
  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 pt-14 pb-24">
      <div className="max-w-md mx-auto">

        {/* ---------------------------------------------------------- */}
        {/*  PRE-SHOW STATE                                             */}
        {/* ---------------------------------------------------------- */}
        {!segment && !loading && (
          <div className="animate-rise">
            {/* Radial background glow */}
            <div className="relative flex flex-col items-center">
              <div
                className="absolute inset-0 -top-8 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(255,61,110,0.10) 0%, transparent 70%)",
                }}
              />

              {/* Avatar area */}
              <div className="relative mb-6">
                {/* Pulsing rings */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    animation: "ring-expand 2.5s ease-out infinite",
                    border: "1.5px solid rgba(255,61,110,0.2)",
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    animation: "ring-expand 2.5s ease-out 0.8s infinite",
                    border: "1.5px solid rgba(233,198,130,0.15)",
                  }}
                />

                {/* Glowing gradient circle */}
                <div
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-coral via-gold/60 to-emerald/40 flex items-center justify-center relative"
                  style={{
                    animation: "glow-breathe 3s ease-in-out infinite",
                  }}
                >
                  {/* Inner dark circle with waveform */}
                  <div className="w-[88px] h-[88px] rounded-full bg-bg flex items-center justify-center">
                    <WaveformBars count={5} height="h-8" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="font-display text-3xl font-bold text-ink mb-1 tracking-tight">
                Your AI Host
              </h2>
              <p className="font-body text-sm text-muted mb-8">
                Daily 90-second show briefing
              </p>

              {/* CTA Button */}
              <button
                onClick={generate}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-coral to-gold text-bg font-bold text-lg font-body tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group cursor-pointer"
                style={{
                  boxShadow: "0 0 24px 4px rgba(255,61,110,0.15), 0 0 48px 8px rgba(233,198,130,0.08)",
                }}
              >
                {/* Subtle shimmer overlay */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 2s linear infinite",
                  }}
                />
                <span className="relative z-10">Start Today&apos;s Show</span>
              </button>

              {/* Mini stat cards */}
              <div className="flex gap-3 mt-6 w-full">
                <StatCard value="120M+" label="Views" />
                <StatCard value="68%" label="Completion" />
                <StatCard value="28min" label="Daily" />
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------- */}
        {/*  LOADING STATE                                               */}
        {/* ---------------------------------------------------------- */}
        {loading && (
          <div className="flex flex-col items-center animate-rise">
            {/* Pulsing avatar */}
            <div className="relative mb-6">
              <div
                className="w-28 h-28 rounded-full bg-gradient-to-br from-coral via-gold/60 to-emerald/40 flex items-center justify-center animate-pulse-glow"
                style={{
                  animation: "glow-breathe 1.5s ease-in-out infinite, pulse-glow 1.5s ease-in-out infinite",
                }}
              >
                <div className="w-[88px] h-[88px] rounded-full bg-bg flex items-center justify-center">
                  <WaveformBars count={5} height="h-8" />
                </div>
              </div>
            </div>

            {/* Typewriter dots text */}
            <div className="flex items-center gap-1 mb-2">
              <span className="font-body text-ink text-base font-medium">
                Preparing your briefing
              </span>
              <span className="flex gap-[2px]">
                {[0, 0.3, 0.6].map((d) => (
                  <span
                    key={d}
                    className="inline-block w-[4px] h-[4px] rounded-full bg-coral"
                    style={{
                      animation: `dot-pulse 1.4s ease-in-out ${d}s infinite`,
                    }}
                  />
                ))}
              </span>
            </div>

            <span className="text-[10px] text-muted/50 tracking-widest uppercase mt-2">
              Powered by Claude
            </span>
          </div>
        )}

        {/* ---------------------------------------------------------- */}
        {/*  POST-SHOW STATE (segments)                                  */}
        {/* ---------------------------------------------------------- */}
        {segment && (
          <div>
            {/* Header (compact) */}
            <div className="text-center mb-6 animate-fade-in">
              <div
                className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-coral to-gold flex items-center justify-center"
                style={{
                  boxShadow: "0 0 20px 4px rgba(255,61,110,0.15)",
                }}
              >
                <div className="w-[52px] h-[52px] rounded-full bg-bg flex items-center justify-center">
                  {speaking ? (
                    <WaveformBars count={4} barClass="bg-gradient-to-t from-coral to-gold" height="h-5" />
                  ) : (
                    <svg className="w-7 h-7 text-coral" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                </div>
              </div>
              <h2 className="font-display text-xl font-bold text-ink">
                Today&apos;s Briefing
              </h2>
            </div>

            {/* Floating visualizer when speaking */}
            {speaking && <FloatingVisualizer />}

            {/* Segment cards */}
            <div className="space-y-1">
              {SEGMENT_META.map((meta, i) => (
                <div key={meta.key}>
                  {/* Card */}
                  <div
                    className={`bg-bg2 rounded-2xl p-4 border-l-[3px] ${meta.borderColor} animate-slide-up transition-all duration-300`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {/* Label row */}
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className={`w-3.5 h-3.5 ${meta.iconColor}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d={meta.icon} />
                      </svg>
                      <span
                        className={`text-[10px] font-bold ${meta.iconColor} tracking-[0.15em] font-body`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    {/* Segment text */}
                    <p className="text-sm text-ink/90 leading-relaxed font-body">
                      {segment[meta.key]}
                    </p>
                  </div>

                  {/* Separator (not after last card) */}
                  {i < SEGMENT_META.length - 1 && (
                    <div className="flex justify-center py-1">
                      <div className="w-6 h-[1px] bg-bg3" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div
              className="flex gap-3 mt-6 animate-slide-up"
              style={{ animationDelay: "0.5s" }}
            >
              {/* Play the Show */}
              <button
                onClick={speak}
                disabled={speaking}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-coral to-gold text-bg font-semibold font-body flex items-center justify-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 cursor-pointer"
              >
                {speaking ? (
                  <>
                    <EqBars />
                    <span className="text-bg font-semibold">Playing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                    </svg>
                    Play the Show
                  </>
                )}
              </button>

              {/* Share Briefing */}
              <button
                onClick={shareBriefing}
                className="py-3.5 px-5 rounded-2xl bg-bg3 text-ink font-semibold font-body flex items-center justify-center gap-2 transition-all duration-200 hover:bg-bg2 active:scale-[0.98] cursor-pointer"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Share
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
