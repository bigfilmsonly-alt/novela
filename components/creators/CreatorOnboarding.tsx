"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CreatorOnboardingProps {
  user: { id: string; email?: string };
  onComplete: () => void;
}

type Step = "welcome" | "profile" | "channel" | "payments" | "success";

const STEPS: Step[] = ["welcome", "profile", "channel", "payments", "success"];

const STEP_LABELS: Record<Step, string> = {
  welcome: "Welcome",
  profile: "Profile",
  channel: "Channel",
  payments: "Payouts",
  success: "Done",
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CREATOR_TIERS = [
  { name: "Starter", range: "0-1K subs", rev: "80%", color: "#8b8aa0" },
  { name: "Rising", range: "1K-10K", rev: "85%", color: "#00D2FF" },
  { name: "Partner", range: "10K-100K", rev: "88%", color: "#FFAB00" },
  { name: "Elite", range: "100K+", rev: "90%", color: "#6C5CE7" },
];

const GENRES = [
  "Romance",
  "Thriller",
  "Comedy",
  "Drama",
  "Sci-Fi",
  "Mystery",
  "Horror",
  "Action",
] as const;

type Genre = (typeof GENRES)[number];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function extractUsername(email?: string): string {
  if (!email) return "";
  return email.split("@")[0].replace(/[^a-zA-Z0-9_. -]/g, "");
}

/* ------------------------------------------------------------------ */
/*  Step Indicator                                                     */
/* ------------------------------------------------------------------ */

function StepIndicator({
  current,
  steps,
}: {
  current: Step;
  steps: Step[];
}) {
  const currentIdx = steps.indexOf(current);

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx;
        return (
          <div key={step} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-body transition-all duration-500 ${
                  isActive
                    ? "bg-gradient-to-r from-[#6C5CE7] to-[#FFAB00] text-[#07070e] scale-110"
                    : isDone
                    ? "bg-[#6C5CE7]/20 text-[#6C5CE7]"
                    : "bg-[#1a1a30] text-[#8b8aa0]/50"
                }`}
              >
                {isDone ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-[9px] font-body tracking-wide transition-colors duration-300 ${
                  isActive
                    ? "text-[#f0eef5] font-bold"
                    : isDone
                    ? "text-[#6C5CE7]"
                    : "text-[#8b8aa0]/40"
                }`}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-6 h-px mb-5 transition-colors duration-500 ${
                  isDone ? "bg-[#6C5CE7]/40" : "bg-[#1a1a30]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CSS-only Celebration Particles                                     */
/* ------------------------------------------------------------------ */

function CelebrationParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 24 }).map((_, i) => ({
        left: 5 + Math.random() * 90,
        delay: Math.random() * 0.6,
        dur: 1.2 + Math.random() * 1,
        size: 4 + Math.random() * 6,
        color:
          i % 4 === 0
            ? "#FFAB00"
            : i % 4 === 1
            ? "#6C5CE7"
            : i % 4 === 2
            ? "#00D2FF"
            : "#f0eef5",
        rotation: Math.random() * 360,
        drift: -30 + Math.random() * 60,
      })),
    []
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-sm"
          style={{
            left: `${p.left}%`,
            bottom: "-5%",
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            opacity: 0,
            animation: `onboard-confetti ${p.dur}s ${p.delay}s ease-out forwards`,
            "--drift": `${p.drift}px`,
            "--rotation": `${p.rotation}deg`,
          } as React.CSSProperties}
        />
      ))}
      <style>{`
        @keyframes onboard-confetti {
          0% { opacity: 1; transform: translateY(0) translateX(0) rotate(0deg); }
          70% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-280px) translateX(var(--drift)) rotate(var(--rotation)); }
        }
      `}</style>
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function CreatorOnboarding({
  user,
  onComplete,
}: CreatorOnboardingProps) {
  /* ---- Step state ---- */
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [isAnimating, setIsAnimating] = useState(false);

  /* ---- Profile state ---- */
  const [displayName, setDisplayName] = useState(
    extractUsername(user.email)
  );
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  /* ---- Channel state ---- */
  const [channelName, setChannelName] = useState("");
  const [channelSlug, setChannelSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [channelDescription, setChannelDescription] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);

  /* ---- Payments state ---- */
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);

  /* ---- General state ---- */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);

  /* ---- Created channel info for success screen ---- */
  const [createdChannel, setCreatedChannel] = useState<{
    name: string;
    slug: string;
  } | null>(null);

  /* ---- Ref for scroll container ---- */
  const containerRef = useRef<HTMLDivElement>(null);

  /* Auto-generate slug from channel name */
  useEffect(() => {
    if (!slugEdited && channelName) {
      setChannelSlug(slugify(channelName));
    }
  }, [channelName, slugEdited]);

  /* Scroll to top on step change */
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  /* ---------------------------------------------------------------- */
  /*  Navigation                                                       */
  /* ---------------------------------------------------------------- */

  const goToStep = useCallback(
    (step: Step, dir: "forward" | "back" = "forward") => {
      if (isAnimating) return;
      setIsAnimating(true);
      setDirection(dir);
      setError("");

      /* Brief exit delay, then swap */
      setTimeout(() => {
        setCurrentStep(step);
        setIsAnimating(false);
      }, 150);
    },
    [isAnimating]
  );

  const goNext = useCallback(() => {
    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) goToStep(STEPS[idx + 1], "forward");
  }, [currentStep, goToStep]);

  const goBack = useCallback(() => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) goToStep(STEPS[idx - 1], "back");
  }, [currentStep, goToStep]);

  /* ---------------------------------------------------------------- */
  /*  API Handlers                                                     */
  /* ---------------------------------------------------------------- */

  const saveProfile = useCallback(async () => {
    if (!displayName.trim()) {
      setError("Display name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/creator/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          display_name: displayName.trim(),
          avatar_url: avatarUrl.trim() || null,
          bio: bio.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save profile.");
      }

      goNext();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save profile."
      );
    } finally {
      setLoading(false);
    }
  }, [displayName, avatarUrl, bio, user.id, goNext]);

  const createChannel = useCallback(async () => {
    if (!channelName.trim()) {
      setError("Channel name is required.");
      return;
    }
    if (!channelSlug.trim()) {
      setError("Channel slug is required.");
      return;
    }
    if (selectedGenres.length === 0) {
      setError("Select at least one genre.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/creator/channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_id: user.id,
          name: channelName.trim(),
          slug: channelSlug.trim(),
          description: channelDescription.trim() || null,
          genres: selectedGenres,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create channel.");
      }

      setCreatedChannel({
        name: channelName.trim(),
        slug: channelSlug.trim(),
      });
      goNext();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create channel."
      );
    } finally {
      setLoading(false);
    }
  }, [
    channelName,
    channelSlug,
    channelDescription,
    selectedGenres,
    user.id,
    goNext,
  ]);

  const connectStripe = useCallback(async () => {
    setStripeLoading(true);
    setError("");

    try {
      const res = await fetch("/api/creator/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start Stripe connect.");
      }

      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
      setStripeConnected(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to connect Stripe."
      );
    } finally {
      setStripeLoading(false);
    }
  }, [user.id]);

  const finishOnboarding = useCallback(() => {
    setShowConfetti(true);
    goToStep("success", "forward");
  }, [goToStep]);

  /* ---------------------------------------------------------------- */
  /*  Genre toggle                                                     */
  /* ---------------------------------------------------------------- */

  const toggleGenre = useCallback((genre: Genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Shared UI Fragments                                              */
  /* ---------------------------------------------------------------- */

  const backButton = (
    <button
      onClick={goBack}
      className="flex items-center gap-1.5 text-sm text-[#8b8aa0] hover:text-[#f0eef5] transition-colors font-body mb-6"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 19l-7-7 7-7"
        />
      </svg>
      Back
    </button>
  );

  const primaryButton = (
    label: string,
    onClick: () => void,
    disabled = false
  ) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#FFAB00] text-[#07070e] font-bold font-body text-base tracking-wide transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_6px_32px_rgba(108,92,231,0.25)] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-none"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2.5">
          <div className="w-5 h-5 border-2 border-[#07070e]/30 border-t-[#07070e] rounded-full animate-spin" />
          Saving...
        </span>
      ) : (
        label
      )}
    </button>
  );

  const secondaryButton = (label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      className="w-full py-3.5 rounded-2xl bg-[#1a1a30] text-[#8b8aa0] hover:text-[#f0eef5] font-body text-sm font-medium transition-all duration-300 hover:bg-[#1a1a30]/80"
    >
      {label}
    </button>
  );

  const errorDisplay = error && (
    <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-[#6C5CE7]/8 border border-[#6C5CE7]/20 mb-4 animate-fade-in">
      <svg
        className="w-4 h-4 text-[#6C5CE7] mt-0.5 shrink-0"
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
      <p className="text-xs text-[#6C5CE7] font-body leading-relaxed">
        {error}
      </p>
    </div>
  );

  /* ---------------------------------------------------------------- */
  /*  Animation wrapper class                                          */
  /* ---------------------------------------------------------------- */

  const slideClass = isAnimating
    ? direction === "forward"
      ? "opacity-0 translate-x-4"
      : "opacity-0 -translate-x-4"
    : "opacity-100 translate-x-0";

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto no-scrollbar px-4 pt-14 pb-28"
    >
      <div className="max-w-md mx-auto">
        <StepIndicator current={currentStep} steps={STEPS} />

        <div
          className={`transition-all duration-300 ease-out ${slideClass}`}
        >
          {/* ════════════════════════════════════════════════════════ */}
          {/*  STEP 1: WELCOME                                        */}
          {/* ════════════════════════════════════════════════════════ */}
          {currentStep === "welcome" && (
            <div className="space-y-6">
              {/* Hero section */}
              <div className="text-center animate-rise">
                <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-[#FFAB00] flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
                  <svg
                    className="w-10 h-10 text-[#07070e]"
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
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight mb-2">
                  Become a Creator on{" "}
                  <span className="text-gradient">Versa TV</span>
                </h2>
                <p className="text-sm text-[#8b8aa0] font-body leading-relaxed max-w-xs mx-auto">
                  Join thousands of filmmakers creating vertical micro-dramas
                  for the next generation of storytelling.
                </p>
              </div>

              {/* Value props */}
              <div
                className="grid grid-cols-1 gap-3 animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                {[
                  {
                    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                    title: "80-90% Revenue Share",
                    desc: "Industry-leading payouts directly to your bank",
                    color: "#FFAB00",
                  },
                  {
                    icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
                    title: "480K+ Monthly Viewers",
                    desc: "Tap into an engaged audience hungry for content",
                    color: "#00D2FF",
                  },
                  {
                    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z",
                    title: "AI-Powered Tools",
                    desc: "Generate scripts, analyze performance, grow faster",
                    color: "#6C5CE7",
                  },
                ].map((prop) => (
                  <div
                    key={prop.title}
                    className="flex items-start gap-3.5 p-4 bg-[#101020] rounded-2xl border border-[#1a1a30]"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${prop.color}15` }}
                    >
                      <svg
                        className="w-5 h-5"
                        style={{ color: prop.color }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={prop.icon}
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-body font-semibold text-sm text-[#f0eef5]">
                        {prop.title}
                      </h4>
                      <p className="text-xs text-[#8b8aa0] font-body mt-0.5 leading-relaxed">
                        {prop.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Revenue tiers */}
              <div
                className="bg-[#101020] rounded-2xl p-5 border border-[#1a1a30] animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                <h3 className="font-body font-semibold text-sm text-[#f0eef5] mb-3">
                  Creator Revenue Tiers
                </h3>
                <div className="space-y-2">
                  {CREATOR_TIERS.map((tier) => (
                    <div
                      key={tier.name}
                      className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-[#1a1a30]/50"
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
                          {tier.range}
                        </span>
                      </div>
                      <span
                        className="text-xs font-bold font-body"
                        style={{ color: tier.color }}
                      >
                        {tier.rev}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Get Started */}
              <div
                className="animate-slide-up"
                style={{ animationDelay: "0.3s" }}
              >
                {primaryButton("Get Started", goNext)}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/*  STEP 2: PROFILE SETUP                                  */}
          {/* ════════════════════════════════════════════════════════ */}
          {currentStep === "profile" && (
            <div className="space-y-5">
              {backButton}

              <div className="text-center mb-2 animate-rise">
                <h2 className="font-display text-2xl font-bold tracking-tight mb-1">
                  Set Up Your Creator Profile
                </h2>
                <p className="text-sm text-[#8b8aa0] font-body">
                  Tell your audience who you are
                </p>
              </div>

              {errorDisplay}

              {/* Display name */}
              <div className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
                <label className="block text-xs font-body font-semibold text-[#f0eef5] mb-2 uppercase tracking-wider">
                  Display Name <span className="text-[#6C5CE7]">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 50))}
                  placeholder="Your creator name"
                  className="w-full bg-[#1a1a30] rounded-xl p-3.5 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 border border-transparent focus:border-[#6C5CE7]/20 transition-all"
                  autoFocus
                />
                <p className="text-[10px] text-[#8b8aa0]/60 font-body mt-1.5">
                  {displayName.length}/50 characters
                </p>
              </div>

              {/* Avatar URL */}
              <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <label className="block text-xs font-body font-semibold text-[#f0eef5] mb-2 uppercase tracking-wider">
                  Profile Picture
                </label>
                <div className="flex items-start gap-4">
                  {/* Avatar preview */}
                  <div className="w-16 h-16 rounded-xl bg-[#1a1a30] border-2 border-dashed border-[#6C5CE7]/30 flex items-center justify-center shrink-0 overflow-hidden">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <svg
                        className="w-7 h-7 text-[#8b8aa0]/40"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full bg-[#1a1a30] rounded-xl p-3 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 border border-transparent focus:border-[#6C5CE7]/20 transition-all"
                    />
                    <p className="text-[10px] text-[#8b8aa0]/60 font-body mt-1.5">
                      Paste an image URL or leave blank for now
                    </p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
                <label className="block text-xs font-body font-semibold text-[#f0eef5] mb-2 uppercase tracking-wider">
                  Bio / Tagline
                  <span className="text-[#8b8aa0] font-normal ml-1 normal-case tracking-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 200))}
                  placeholder="Tell your audience what kind of stories you create..."
                  rows={3}
                  className="w-full bg-[#1a1a30] rounded-xl p-3.5 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 resize-none focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 border border-transparent focus:border-[#6C5CE7]/20 transition-all"
                />
                <p className="text-[10px] text-[#8b8aa0]/60 font-body mt-1.5">
                  {bio.length}/200 characters
                </p>
              </div>

              {/* Save */}
              <div className="pt-2 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                {primaryButton("Save & Continue", saveProfile, !displayName.trim())}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/*  STEP 3: CREATE CHANNEL                                 */}
          {/* ════════════════════════════════════════════════════════ */}
          {currentStep === "channel" && (
            <div className="space-y-5">
              {backButton}

              <div className="text-center mb-2 animate-rise">
                <h2 className="font-display text-2xl font-bold tracking-tight mb-1">
                  Create Your Channel
                </h2>
                <p className="text-sm text-[#8b8aa0] font-body">
                  Your home for publishing micro-dramas
                </p>
              </div>

              {errorDisplay}

              {/* Channel name */}
              <div className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
                <label className="block text-xs font-body font-semibold text-[#f0eef5] mb-2 uppercase tracking-wider">
                  Channel Name <span className="text-[#6C5CE7]">*</span>
                </label>
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value.slice(0, 60))}
                  placeholder="My Awesome Channel"
                  className="w-full bg-[#1a1a30] rounded-xl p-3.5 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 border border-transparent focus:border-[#6C5CE7]/20 transition-all"
                  autoFocus
                />
              </div>

              {/* Slug */}
              <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
                <label className="block text-xs font-body font-semibold text-[#f0eef5] mb-2 uppercase tracking-wider">
                  Channel URL <span className="text-[#6C5CE7]">*</span>
                </label>
                <div className="flex items-center gap-0 bg-[#1a1a30] rounded-xl overflow-hidden border border-transparent focus-within:ring-2 focus-within:ring-[#6C5CE7]/50 focus-within:border-[#6C5CE7]/20 transition-all">
                  <span className="text-xs text-[#8b8aa0] font-body pl-3.5 shrink-0">
                    versatv.com/@
                  </span>
                  <input
                    type="text"
                    value={channelSlug}
                    onChange={(e) => {
                      setSlugEdited(true);
                      setChannelSlug(
                        slugify(e.target.value)
                      );
                    }}
                    placeholder="your-slug"
                    className="flex-1 bg-transparent p-3.5 pl-0.5 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 focus:outline-none"
                  />
                </div>
                {channelSlug && (
                  <p className="text-[10px] text-[#00D2FF] font-body mt-1.5 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                    versatv.com/@{channelSlug}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="animate-slide-up" style={{ animationDelay: "0.15s" }}>
                <label className="block text-xs font-body font-semibold text-[#f0eef5] mb-2 uppercase tracking-wider">
                  Description
                  <span className="text-[#8b8aa0] font-normal ml-1 normal-case tracking-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  value={channelDescription}
                  onChange={(e) =>
                    setChannelDescription(e.target.value.slice(0, 300))
                  }
                  placeholder="What kind of micro-dramas will your channel feature?"
                  rows={3}
                  className="w-full bg-[#1a1a30] rounded-xl p-3.5 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/40 resize-none focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 border border-transparent focus:border-[#6C5CE7]/20 transition-all"
                />
              </div>

              {/* Genre select */}
              <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
                <label className="block text-xs font-body font-semibold text-[#f0eef5] mb-2 uppercase tracking-wider">
                  Genre Focus <span className="text-[#6C5CE7]">*</span>
                  <span className="text-[#8b8aa0] font-normal ml-1 normal-case tracking-normal">
                    (select one or more)
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map((genre) => {
                    const isSelected = selectedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`px-4 py-2 rounded-full text-xs font-bold font-body tracking-wide transition-all duration-200 ${
                          isSelected
                            ? "bg-[#6C5CE7] text-white shadow-[0_0_16px_rgba(108,92,231,0.3)]"
                            : "bg-[#1a1a30] text-[#8b8aa0] hover:text-[#f0eef5] hover:bg-[#1a1a30]/80"
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 inline mr-1 -mt-px"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Create */}
              <div className="pt-2 animate-slide-up" style={{ animationDelay: "0.25s" }}>
                {primaryButton(
                  "Create Channel",
                  createChannel,
                  !channelName.trim() || !channelSlug.trim() || selectedGenres.length === 0
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/*  STEP 4: CONNECT PAYMENTS                               */}
          {/* ════════════════════════════════════════════════════════ */}
          {currentStep === "payments" && (
            <div className="space-y-5">
              {backButton}

              <div className="text-center mb-2 animate-rise">
                <h2 className="font-display text-2xl font-bold tracking-tight mb-1">
                  Set Up Payouts
                </h2>
                <p className="text-sm text-[#8b8aa0] font-body">
                  Get paid for your content via Stripe
                </p>
              </div>

              {errorDisplay}

              {/* Stripe explanation card */}
              <div
                className="bg-[#101020] rounded-2xl p-5 border border-[#1a1a30] animate-slide-up"
                style={{ animationDelay: "0.05s" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[#635BFF]/10 flex items-center justify-center shrink-0">
                    <svg
                      className="w-6 h-6 text-[#635BFF]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-body font-semibold text-sm text-[#f0eef5]">
                      Stripe Connect
                    </h3>
                    <p className="text-xs text-[#8b8aa0] font-body">
                      Secure, instant payments worldwide
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {[
                    {
                      label: "Platform fee",
                      value: "15%",
                      desc: "covers hosting, CDN, AI tools",
                    },
                    {
                      label: "Your share",
                      value: "85%+",
                      desc: "increases with subscriber tier",
                    },
                    {
                      label: "Payout schedule",
                      value: "Weekly",
                      desc: "direct to your bank account",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#1a1a30]/50"
                    >
                      <div>
                        <span className="text-xs text-[#f0eef5] font-body font-medium">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-[#8b8aa0] font-body ml-2">
                          {item.desc}
                        </span>
                      </div>
                      <span className="text-xs font-bold font-body text-[#FFAB00]">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 pt-2 border-t border-[#1a1a30]">
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 text-[#00D2FF]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                      />
                    </svg>
                    <span className="text-[10px] text-[#8b8aa0] font-body">
                      SSL Secured
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 text-[#00D2FF]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                      />
                    </svg>
                    <span className="text-[10px] text-[#8b8aa0] font-body">
                      PCI Compliant
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg
                      className="w-3.5 h-3.5 text-[#635BFF]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                    </svg>
                    <span className="text-[10px] text-[#8b8aa0] font-body">
                      Powered by Stripe
                    </span>
                  </div>
                </div>
              </div>

              {/* Connect / Connected state */}
              <div className="space-y-3 animate-slide-up" style={{ animationDelay: "0.15s" }}>
                {stripeConnected ? (
                  <div className="w-full py-4 rounded-2xl bg-[#00D2FF]/10 border border-[#00D2FF]/20 flex items-center justify-center gap-2.5">
                    <svg
                      className="w-5 h-5 text-[#00D2FF]"
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
                    <span className="text-sm font-bold font-body text-[#00D2FF]">
                      Stripe Connected
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={connectStripe}
                    disabled={stripeLoading}
                    className="w-full py-4 rounded-2xl bg-[#635BFF] text-white font-bold font-body text-base tracking-wide transition-all duration-300 hover:scale-[1.02] hover:bg-[#5249D6] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2.5"
                  >
                    {stripeLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-5 h-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                        </svg>
                        Connect with Stripe
                      </>
                    )}
                  </button>
                )}

                {primaryButton(
                  stripeConnected ? "Continue" : "Skip for Now",
                  finishOnboarding
                )}

                {!stripeConnected && (
                  <p className="text-[10px] text-[#8b8aa0]/60 font-body text-center leading-relaxed">
                    You can connect Stripe later from your dashboard settings.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/*  STEP 5: SUCCESS                                        */}
          {/* ════════════════════════════════════════════════════════ */}
          {currentStep === "success" && (
            <div className="space-y-6 relative">
              {showConfetti && <CelebrationParticles />}

              {/* Celebration header */}
              <div className="text-center animate-rise">
                <div className="relative w-20 h-20 mx-auto mb-5">
                  {/* Pulsing rings */}
                  <div className="absolute inset-0 rounded-full bg-[#6C5CE7]/10 animate-ping" style={{ animationDuration: "2s" }} />
                  <div className="absolute inset-0 rounded-full bg-[#6C5CE7]/5 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
                  {/* Checkmark circle */}
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#FFAB00] flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-[#07070e]"
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
                  </div>
                </div>

                <h2 className="font-display text-2xl font-bold tracking-tight mb-2">
                  You{"'"}re All Set!
                </h2>
                <p className="text-sm text-[#8b8aa0] font-body leading-relaxed">
                  Welcome to the Versa TV creator community.
                  <br />
                  Time to tell your stories.
                </p>
              </div>

              {/* Summary card */}
              <div
                className="bg-[#101020] rounded-2xl p-5 border border-[#1a1a30] space-y-3 animate-slide-up"
                style={{ animationDelay: "0.1s" }}
              >
                <h3 className="font-body font-semibold text-xs text-[#8b8aa0] uppercase tracking-wider">
                  Your Creator Summary
                </h3>

                <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-[#1a1a30]/50">
                  <span className="text-xs text-[#8b8aa0] font-body">
                    Creator
                  </span>
                  <span className="text-xs font-bold text-[#f0eef5] font-body">
                    {displayName || "Not set"}
                  </span>
                </div>

                {createdChannel && (
                  <>
                    <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-[#1a1a30]/50">
                      <span className="text-xs text-[#8b8aa0] font-body">
                        Channel
                      </span>
                      <span className="text-xs font-bold text-[#f0eef5] font-body">
                        {createdChannel.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-[#1a1a30]/50">
                      <span className="text-xs text-[#8b8aa0] font-body">
                        URL
                      </span>
                      <span className="text-xs font-bold text-[#00D2FF] font-body">
                        versatv.com/@{createdChannel.slug}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-[#1a1a30]/50">
                  <span className="text-xs text-[#8b8aa0] font-body">
                    Payouts
                  </span>
                  {stripeConnected ? (
                    <span className="text-xs font-bold text-[#00D2FF] font-body flex items-center gap-1">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Connected
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-[#FFAB00] font-body">
                      Not connected yet
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-[#1a1a30]/50">
                  <span className="text-xs text-[#8b8aa0] font-body">
                    Tier
                  </span>
                  <span className="text-xs font-bold text-[#8b8aa0] font-body">
                    Starter (80% revenue)
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div
                className="space-y-3 animate-slide-up"
                style={{ animationDelay: "0.2s" }}
              >
                {primaryButton("Go to Dashboard", onComplete)}

                <button
                  onClick={onComplete}
                  className="w-full py-3.5 rounded-2xl bg-[#1a1a30] text-[#f0eef5] font-body text-sm font-medium transition-all duration-300 hover:bg-[#1a1a30]/80 flex items-center justify-center gap-2"
                >
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
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                  Upload Your First Drama
                </button>
              </div>

              {/* Footer note */}
              <p
                className="text-[10px] text-[#8b8aa0]/50 font-body text-center leading-relaxed animate-fade-in"
                style={{ animationDelay: "0.4s" }}
              >
                Powered by Filmology Labs -- $250M production facility
                <br />
                21 soundstages, LED volume wall, Paterson NJ
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
