"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChannelSettingsProps {
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
  onBack: () => void;
  onChannelUpdated: (channel: any) => void;
}

interface StripeStatus {
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  email: string | null;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CREATOR_TIERS = [
  { name: "Starter", range: "0-1K subs", rev: "80%", color: "#8b8aa0", threshold: 0 },
  { name: "Rising", range: "1K-10K", rev: "85%", color: "#00D2FF", threshold: 1000 },
  { name: "Partner", range: "10K-100K", rev: "88%", color: "#FFAB00", threshold: 10000 },
  { name: "Elite", range: "100K+", rev: "90%", color: "#6C5CE7", threshold: 100000 },
];

const CREATOR_RESOURCES = [
  "Filmmaking for Vertical: Masterclass",
  "Monetization Playbook: $10K/month Guide",
  "AI Studio: Advanced Techniques",
  "Community: Connect with 5K+ Creators",
];

const GENRE_SUGGESTIONS = [
  "Drama", "Thriller", "Romance", "Sci-Fi", "Comedy",
  "Horror", "Fantasy", "Crime", "Mystery", "Action",
];

const DESC_MAX = 300;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function getCurrentTier(subscriberCount: number) {
  let current = CREATOR_TIERS[0];
  for (const tier of CREATOR_TIERS) {
    if (subscriberCount >= tier.threshold) current = tier;
  }
  return current;
}

/* ------------------------------------------------------------------ */
/*  Inline save confirmation (checkmark that appears briefly)          */
/* ------------------------------------------------------------------ */

function SaveIndicator({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[#00D2FF] text-xs font-bold font-body animate-fade-in">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      Saved
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Archive Confirmation Modal                                         */
/* ------------------------------------------------------------------ */

function ArchiveModal({
  channelName,
  onConfirm,
  onCancel,
  archiving,
}: {
  channelName: string;
  onConfirm: () => void;
  onCancel: () => void;
  archiving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#101020] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full animate-slide-up">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-[#f0eef5]">Archive Channel?</h3>
            <p className="text-xs text-[#8b8aa0] font-body">This cannot be easily undone</p>
          </div>
        </div>

        <p className="text-sm text-[#8b8aa0] font-body leading-relaxed mb-5">
          Archiving <span className="text-[#f0eef5] font-semibold">{channelName}</span> will
          hide your channel and all content from public view. Existing subscribers will be
          notified. Your earnings history and data will be preserved.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-[#1a1a30] text-[#8b8aa0] font-semibold text-sm font-body hover:text-[#f0eef5] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={archiving}
            className="flex-1 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-bold text-sm font-body hover:bg-red-500/25 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {archiving ? (
              <>
                <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                Archiving...
              </>
            ) : (
              "Archive Channel"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CHANNEL SETTINGS COMPONENT                                         */
/* ================================================================== */

export default function ChannelSettings({
  user,
  channel,
  onBack,
  onChannelUpdated,
}: ChannelSettingsProps) {
  /* ── Profile form state ── */
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState("");

  /* ── Channel form state ── */
  const [channelName, setChannelName] = useState(channel.name);
  const [channelSlug, setChannelSlug] = useState(channel.slug);
  const [channelDesc, setChannelDesc] = useState(channel.description || "");
  const [genreTags, setGenreTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [channelSaving, setChannelSaving] = useState(false);
  const [channelSaved, setChannelSaved] = useState(false);
  const [channelError, setChannelError] = useState("");

  /* ── Stripe state ── */
  const [stripeConnecting, setStripeConnecting] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState("");
  const [showDisconnectWarning, setShowDisconnectWarning] = useState(false);

  /* ── Archive state ── */
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);

  /* ── Refs ── */
  const tagInputRef = useRef<HTMLInputElement>(null);

  /* ── Computed ── */
  const currentTier = getCurrentTier(channel.subscriber_count);
  const isStripeConnected = !!channel.stripe_account_id;

  /* ---------------------------------------------------------------- */
  /*  Load profile data on mount                                       */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/creator/profile");
        if (res.ok) {
          const data = await res.json();
          setDisplayName(data.display_name || "");
          setAvatarUrl(data.avatar_url || "");
        }
      } catch {
        // Silently fall back to empty state
      }
    }
    loadProfile();
  }, []);

  /* ── Load Stripe status if connected ── */
  useEffect(() => {
    if (!isStripeConnected) return;
    async function loadStripeStatus() {
      setStripeLoading(true);
      try {
        const res = await fetch("/api/creator/stripe/status");
        if (res.ok) {
          const data = await res.json();
          setStripeStatus(data);
        }
      } catch {
        // Status will show as null
      }
      setStripeLoading(false);
    }
    loadStripeStatus();
  }, [isStripeConnected]);

  /* ---------------------------------------------------------------- */
  /*  Profile save                                                     */
  /* ---------------------------------------------------------------- */
  const saveProfile = useCallback(async () => {
    if (profileSaving) return;
    setProfileSaving(true);
    setProfileError("");
    setProfileSaved(false);

    try {
      const res = await fetch("/api/creator/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          avatar_url: avatarUrl.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to save");
    }
    setProfileSaving(false);
  }, [displayName, avatarUrl, profileSaving]);

  /* ---------------------------------------------------------------- */
  /*  Channel save                                                     */
  /* ---------------------------------------------------------------- */
  const saveChannel = useCallback(async () => {
    if (channelSaving) return;

    if (!channelName.trim()) {
      setChannelError("Channel name is required");
      return;
    }
    if (!channelSlug.trim()) {
      setChannelError("Channel slug is required");
      return;
    }
    if (channelDesc.length > DESC_MAX) {
      setChannelError(`Description must be under ${DESC_MAX} characters`);
      return;
    }

    setChannelSaving(true);
    setChannelError("");
    setChannelSaved(false);

    try {
      const res = await fetch("/api/creator/channel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: channelName.trim(),
          slug: slugify(channelSlug),
          description: channelDesc.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update channel");
      }

      const updated = await res.json();
      onChannelUpdated(updated);
      setChannelSlug(updated.slug || channelSlug);
      setChannelSaved(true);
      setTimeout(() => setChannelSaved(false), 3000);
    } catch (err) {
      setChannelError(err instanceof Error ? err.message : "Failed to save");
    }
    setChannelSaving(false);
  }, [channelName, channelSlug, channelDesc, channelSaving, onChannelUpdated]);

  /* ---------------------------------------------------------------- */
  /*  Genre tag management                                             */
  /* ---------------------------------------------------------------- */
  const addTag = useCallback((tag: string) => {
    const cleaned = tag.trim();
    if (!cleaned || genreTags.includes(cleaned) || genreTags.length >= 5) return;
    setGenreTags((prev) => [...prev, cleaned]);
    setNewTag("");
    setShowTagSuggestions(false);
  }, [genreTags]);

  const removeTag = useCallback((tag: string) => {
    setGenreTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Stripe Connect                                                   */
  /* ---------------------------------------------------------------- */
  const connectStripe = useCallback(async () => {
    if (stripeConnecting) return;
    setStripeConnecting(true);
    setStripeError("");

    try {
      const res = await fetch("/api/creator/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelName: channel.name,
          email: user.email || "",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start Stripe onboarding");
      }

      if (data.url && data.url !== "#") {
        window.open(data.url, "_blank");
      }
    } catch (err) {
      setStripeError(err instanceof Error ? err.message : "Connection failed");
    }
    setStripeConnecting(false);
  }, [stripeConnecting, channel.name, user.email]);

  /* ---------------------------------------------------------------- */
  /*  Archive channel                                                  */
  /* ---------------------------------------------------------------- */
  const archiveChannel = useCallback(async () => {
    if (archiving) return;
    setArchiving(true);

    try {
      const res = await fetch("/api/creator/channel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to archive channel");
      }

      setShowArchiveModal(false);
      onBack();
    } catch {
      // Keep modal open on error
    }
    setArchiving(false);
  }, [archiving, onBack]);

  /* ---------------------------------------------------------------- */
  /*  Filtered tag suggestions                                         */
  /* ---------------------------------------------------------------- */
  const filteredSuggestions = GENRE_SUGGESTIONS.filter(
    (g) =>
      !genreTags.includes(g) &&
      g.toLowerCase().includes(newTag.toLowerCase())
  );

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 pt-14 pb-24">
      <div className="max-w-md mx-auto">

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  HEADER                                                     */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-3 mb-8 animate-rise">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-[#101020] border border-[#1a1a30] flex items-center justify-center hover:bg-[#1a1a30] transition-colors active:scale-95 flex-shrink-0"
          >
            <svg className="w-5 h-5 text-[#f0eef5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#f0eef5]">
              Channel Settings
            </h2>
            <p className="text-xs text-[#8b8aa0] font-body">
              Manage your profile, channel, and payouts
            </p>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  SECTION 1: PROFILE                                         */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div
          className="bg-[#101020] rounded-2xl p-5 border border-[#1a1a30] mb-4 animate-slide-up"
          style={{ animationDelay: "0.05s" }}
        >
          <h3 className="font-body font-semibold text-sm text-[#f0eef5] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#6C5CE7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Your Profile
          </h3>

          {/* Avatar preview */}
          <div className="flex items-center gap-4 mb-5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-[#6C5CE7]/40 flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6C5CE7] to-[#FFAB00] flex items-center justify-center text-xl font-bold font-display text-[#07070e] flex-shrink-0 border-2 border-[#6C5CE7]/40">
                {displayName ? displayName.charAt(0).toUpperCase() : "?"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#f0eef5] font-body truncate">
                {displayName || "Set your name"}
              </p>
              <p className="text-xs text-[#8b8aa0] font-body truncate">
                {user.email || "No email set"}
              </p>
            </div>
          </div>

          {/* Display name */}
          <label className="block mb-1.5">
            <span className="text-xs text-[#8b8aa0] font-body font-medium uppercase tracking-wider">
              Display Name
            </span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your creator name"
            maxLength={50}
            className="w-full bg-[#1a1a30] rounded-xl p-3.5 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/50 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 border border-transparent focus:border-[#6C5CE7]/30 transition-colors mb-4"
          />

          {/* Avatar URL */}
          <label className="block mb-1.5">
            <span className="text-xs text-[#8b8aa0] font-body font-medium uppercase tracking-wider">
              Avatar URL
            </span>
          </label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full bg-[#1a1a30] rounded-xl p-3.5 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/50 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 border border-transparent focus:border-[#6C5CE7]/30 transition-colors mb-4"
          />

          {/* Error / Save */}
          {profileError && (
            <p className="text-xs text-red-400 font-body mb-3">{profileError}</p>
          )}

          <div className="flex items-center justify-between">
            <SaveIndicator show={profileSaved} />
            <button
              onClick={saveProfile}
              disabled={profileSaving}
              className="ml-auto px-5 py-2.5 rounded-xl bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 text-[#6C5CE7] font-bold text-sm font-body hover:bg-[#6C5CE7]/25 transition-all active:scale-[0.97] disabled:opacity-50 flex items-center gap-2"
            >
              {profileSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#6C5CE7]/30 border-t-[#6C5CE7] rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  SECTION 2: CHANNEL INFO                                    */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div
          className="bg-[#101020] rounded-2xl p-5 border border-[#1a1a30] mb-4 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
        >
          <h3 className="font-body font-semibold text-sm text-[#f0eef5] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#FFAB00]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Channel Details
          </h3>

          {/* Channel name */}
          <label className="block mb-1.5">
            <span className="text-xs text-[#8b8aa0] font-body font-medium uppercase tracking-wider">
              Channel Name
            </span>
          </label>
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            placeholder="My Channel"
            maxLength={60}
            className="w-full bg-[#1a1a30] rounded-xl p-3.5 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/50 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 border border-transparent focus:border-[#6C5CE7]/30 transition-colors mb-4"
          />

          {/* Slug */}
          <label className="block mb-1.5">
            <span className="text-xs text-[#8b8aa0] font-body font-medium uppercase tracking-wider">
              Channel Slug
            </span>
          </label>
          <div className="relative mb-2">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8b8aa0] font-body pointer-events-none">
              @
            </span>
            <input
              type="text"
              value={channelSlug}
              onChange={(e) => setChannelSlug(slugify(e.target.value))}
              placeholder="my-channel"
              maxLength={80}
              className="w-full bg-[#1a1a30] rounded-xl p-3.5 pl-8 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/50 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 border border-transparent focus:border-[#6C5CE7]/30 transition-colors"
            />
          </div>
          <p className="text-[11px] text-[#8b8aa0]/60 font-body mb-4">
            versatv.com/@{channelSlug || "your-slug"}
          </p>

          {/* Description */}
          <label className="block mb-1.5">
            <span className="text-xs text-[#8b8aa0] font-body font-medium uppercase tracking-wider">
              Description
            </span>
          </label>
          <div className="relative mb-1">
            <textarea
              value={channelDesc}
              onChange={(e) => setChannelDesc(e.target.value.slice(0, DESC_MAX))}
              placeholder="Tell viewers what your channel is about..."
              rows={3}
              className="w-full bg-[#1a1a30] rounded-xl p-3.5 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/50 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 border border-transparent focus:border-[#6C5CE7]/30 transition-colors resize-none leading-relaxed"
            />
          </div>
          <div className="flex justify-end mb-4">
            <span
              className={`text-[11px] font-body tabular-nums ${
                channelDesc.length > DESC_MAX * 0.9
                  ? "text-red-400"
                  : channelDesc.length > DESC_MAX * 0.7
                  ? "text-[#FFAB00]"
                  : "text-[#8b8aa0]/60"
              }`}
            >
              {channelDesc.length}/{DESC_MAX}
            </span>
          </div>

          {/* Genre tags */}
          <label className="block mb-1.5">
            <span className="text-xs text-[#8b8aa0] font-body font-medium uppercase tracking-wider">
              Genre Tags
            </span>
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {genreTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#6C5CE7]/15 border border-[#6C5CE7]/25 text-xs font-semibold text-[#6C5CE7] font-body"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="w-3.5 h-3.5 rounded-full bg-[#6C5CE7]/30 flex items-center justify-center hover:bg-[#6C5CE7]/50 transition-colors"
                >
                  <svg className="w-2.5 h-2.5 text-[#6C5CE7]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>

          {genreTags.length < 5 && (
            <div className="relative mb-4">
              <input
                ref={tagInputRef}
                type="text"
                value={newTag}
                onChange={(e) => {
                  setNewTag(e.target.value);
                  setShowTagSuggestions(true);
                }}
                onFocus={() => setShowTagSuggestions(true)}
                onBlur={() => setTimeout(() => setShowTagSuggestions(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(newTag);
                  }
                }}
                placeholder="Add a genre tag..."
                maxLength={20}
                className="w-full bg-[#1a1a30] rounded-xl p-3 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/50 focus:outline-none focus:ring-2 focus:ring-[#6C5CE7]/50 border border-transparent focus:border-[#6C5CE7]/30 transition-colors"
              />
              {showTagSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-[#1a1a30] rounded-xl border border-[#6C5CE7]/20 overflow-hidden shadow-xl animate-fade-in">
                  {filteredSuggestions.slice(0, 5).map((s) => (
                    <button
                      key={s}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addTag(s);
                      }}
                      className="w-full text-left px-3.5 py-2.5 text-sm text-[#f0eef5]/80 font-body hover:bg-[#6C5CE7]/10 hover:text-[#f0eef5] transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {genreTags.length >= 5 && (
            <p className="text-[11px] text-[#8b8aa0]/60 font-body mb-4">
              Maximum 5 tags reached
            </p>
          )}

          {/* Error / Save */}
          {channelError && (
            <p className="text-xs text-red-400 font-body mb-3">{channelError}</p>
          )}

          <div className="flex items-center justify-between">
            <SaveIndicator show={channelSaved} />
            <button
              onClick={saveChannel}
              disabled={channelSaving}
              className="ml-auto px-5 py-2.5 rounded-xl bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 text-[#6C5CE7] font-bold text-sm font-body hover:bg-[#6C5CE7]/25 transition-all active:scale-[0.97] disabled:opacity-50 flex items-center gap-2"
            >
              {channelSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-[#6C5CE7]/30 border-t-[#6C5CE7] rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Channel"
              )}
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  SECTION 3: STRIPE CONNECT                                  */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div
          className="bg-[#101020] rounded-2xl p-5 border border-[#635BFF]/20 mb-4 animate-slide-up"
          style={{ animationDelay: "0.15s" }}
        >
          <h3 className="font-body font-semibold text-sm text-[#f0eef5] mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#635BFF]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
            </svg>
            Payments & Payouts
          </h3>

          {!isStripeConnected ? (
            /* ── Not connected ── */
            <div>
              <p className="text-sm text-[#8b8aa0] font-body leading-relaxed mb-5">
                Connect your Stripe account to receive payouts from episode sales,
                tips, and subscriptions. We take a{" "}
                <span className="text-[#FFAB00] font-semibold">15% platform fee</span>{" "}
                -- you keep the rest.
              </p>

              {/* Revenue share tiers */}
              <div className="space-y-2 mb-5">
                {CREATOR_TIERS.map((tier) => {
                  const isCurrent = tier.name === currentTier.name;
                  return (
                    <div
                      key={tier.name}
                      className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl transition-colors ${
                        isCurrent
                          ? "bg-[#FFAB00]/8 border border-[#FFAB00]/20"
                          : "bg-[#1a1a30]/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: tier.color }} />
                        <span className="text-xs font-body font-semibold text-[#f0eef5]">
                          {tier.name}
                        </span>
                        <span className="text-[10px] text-[#8b8aa0] font-body">
                          {tier.range}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-body" style={{ color: tier.color }}>
                          {tier.rev}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] text-[#FFAB00] font-bold tracking-wider">
                            YOU
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {stripeError && (
                <p className="text-xs text-red-400 font-body mb-3">{stripeError}</p>
              )}

              {/* Connect button */}
              <button
                onClick={connectStripe}
                disabled={stripeConnecting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#635BFF] to-[#7C3AFF] text-white font-bold text-base font-body tracking-wide transition-all hover:scale-[1.02] hover:shadow-[0_6px_32px_rgba(99,91,255,0.3)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2.5"
              >
                {stripeConnecting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                    </svg>
                    Connect with Stripe
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-2.5">
                <svg className="w-3 h-3 text-[#8b8aa0]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span className="text-[10px] text-[#8b8aa0]/50 font-body">
                  Secure onboarding via Stripe
                </span>
              </div>
            </div>
          ) : (
            /* ── Connected ── */
            <div>
              {/* Connected status */}
              <div className="flex items-center gap-3 mb-4 p-3.5 rounded-xl bg-[#00D2FF]/8 border border-[#00D2FF]/20">
                <div className="w-8 h-8 rounded-full bg-[#00D2FF]/15 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4.5 h-4.5 text-[#00D2FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#00D2FF] font-body">
                    Stripe Connected
                  </p>
                  <p className="text-[11px] text-[#8b8aa0] font-body truncate">
                    Account: {channel.stripe_account_id}
                  </p>
                </div>
              </div>

              {/* Stripe status details */}
              {stripeLoading ? (
                <div className="flex items-center justify-center py-6">
                  <span className="w-5 h-5 border-2 border-[#635BFF]/30 border-t-[#635BFF] rounded-full animate-spin" />
                </div>
              ) : stripeStatus ? (
                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#1a1a30]/50">
                    <span className="text-xs text-[#8b8aa0] font-body">Charges</span>
                    <span className={`text-xs font-bold font-body ${stripeStatus.charges_enabled ? "text-[#00D2FF]" : "text-[#FFAB00]"}`}>
                      {stripeStatus.charges_enabled ? "Enabled" : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#1a1a30]/50">
                    <span className="text-xs text-[#8b8aa0] font-body">Payouts</span>
                    <span className={`text-xs font-bold font-body ${stripeStatus.payouts_enabled ? "text-[#00D2FF]" : "text-[#FFAB00]"}`}>
                      {stripeStatus.payouts_enabled ? "Enabled" : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#1a1a30]/50">
                    <span className="text-xs text-[#8b8aa0] font-body">Onboarding</span>
                    <span className={`text-xs font-bold font-body ${stripeStatus.details_submitted ? "text-[#00D2FF]" : "text-[#FFAB00]"}`}>
                      {stripeStatus.details_submitted ? "Complete" : "Incomplete"}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Current tier */}
              <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-[#1a1a30]/50 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: currentTier.color }} />
                  <span className="text-xs text-[#8b8aa0] font-body">Your Tier</span>
                </div>
                <span className="text-xs font-bold font-body" style={{ color: currentTier.color }}>
                  {currentTier.name} ({currentTier.rev} revenue)
                </span>
              </div>

              {/* Manage button */}
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 rounded-xl bg-[#635BFF]/15 border border-[#635BFF]/30 text-[#635BFF] font-bold text-sm font-body hover:bg-[#635BFF]/25 transition-all active:scale-[0.97] flex items-center justify-center gap-2 mb-3"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Manage Stripe Account
              </a>

              {/* Disconnect option */}
              {!showDisconnectWarning ? (
                <button
                  onClick={() => setShowDisconnectWarning(true)}
                  className="w-full text-center py-2 text-xs text-[#8b8aa0]/60 font-body hover:text-red-400/60 transition-colors"
                >
                  Disconnect Stripe Account
                </button>
              ) : (
                <div className="p-3.5 rounded-xl bg-red-500/8 border border-red-500/20 animate-fade-in">
                  <p className="text-xs text-red-400/80 font-body mb-2.5 leading-relaxed">
                    Disconnecting will stop all payouts. Any pending earnings will
                    still be transferred. You can reconnect later.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDisconnectWarning(false)}
                      className="flex-1 py-2 rounded-lg bg-[#1a1a30] text-[#8b8aa0] text-xs font-semibold font-body hover:text-[#f0eef5] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      className="flex-1 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold font-body hover:bg-red-500/25 transition-colors"
                    >
                      Confirm Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  SECTION 4: DANGER ZONE                                     */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div
          className="bg-[#101020] rounded-2xl p-5 border border-red-500/15 mb-4 animate-slide-up"
          style={{ animationDelay: "0.2s" }}
        >
          <h3 className="font-body font-semibold text-sm text-red-400/80 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            Danger Zone
          </h3>

          <p className="text-xs text-[#8b8aa0]/70 font-body leading-relaxed mb-4">
            Archiving your channel will hide it from public view. Your content,
            subscriber list, and earnings history will be preserved, but no new
            views or purchases will occur. This action requires re-approval to undo.
          </p>

          <button
            onClick={() => setShowArchiveModal(true)}
            className="w-full py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400/80 font-semibold text-sm font-body hover:bg-red-500/15 hover:text-red-400 transition-all active:scale-[0.97]"
          >
            Archive Channel
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/*  SECTION 5: CREATOR RESOURCES                               */}
        {/* ════════════════════════════════════════════════════════════ */}
        <div
          className="bg-gradient-to-br from-[#6C5CE7]/10 to-[#FFAB00]/10 rounded-2xl p-5 border border-[#6C5CE7]/20 mb-6 animate-slide-up"
          style={{ animationDelay: "0.25s" }}
        >
          <h3 className="font-body font-semibold text-sm text-[#f0eef5] mb-3">
            Creator Resources
          </h3>
          <div className="space-y-2.5">
            {CREATOR_RESOURCES.map((resource) => (
              <button
                key={resource}
                className="w-full flex items-center gap-2.5 py-2.5 px-3 rounded-xl bg-white/4 hover:bg-white/8 transition-colors text-left"
              >
                <svg className="w-4 h-4 text-[#6C5CE7] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <span className="text-xs text-[#f0eef5]/80 font-body">{resource}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <p
          className="text-center text-[10px] text-[#8b8aa0]/60 font-body leading-relaxed mb-4 animate-rise"
          style={{ animationDelay: "0.3s" }}
        >
          Powered by Filmology Labs &mdash; 250,000 sq ft production facility, Paterson, NJ
        </p>
      </div>

      {/* ── Archive Modal ── */}
      {showArchiveModal && (
        <ArchiveModal
          channelName={channel.name}
          onConfirm={archiveChannel}
          onCancel={() => setShowArchiveModal(false)}
          archiving={archiving}
        />
      )}
    </div>
  );
}
