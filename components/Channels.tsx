"use client";

import { useState } from "react";
import { SAMPLE_CHANNELS } from "@/lib/sampleData";
import type { Channel } from "@/lib/types";

interface ChannelsProps {
  channels?: Channel[];
}

const STATS_BAR = [
  { value: "80+", label: "Originals" },
  { value: "120M+", label: "Views" },
  { value: "$6.5B", label: "Market" },
  { value: "68%", label: "Completion" },
  { value: "480K", label: "MAU" },
];

const BOTTOM_STATS = [
  { value: "80+", label: "Originals" },
  { value: "120M+", label: "Episode Views" },
  { value: "$6.5B", label: "Market Size" },
  { value: "21", label: "Soundstages" },
];

const MINI_FEED_GRADIENTS = [
  "from-coral/70 to-gold/70",
  "from-[#00D2FF]/70 to-[#3b82f6]/70",
  "from-[#a855f7]/70 to-coral/70",
];

export default function Channels({ channels }: ChannelsProps) {
  const [launching, setLaunching] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [subscribed, setSubscribed] = useState<Record<string, boolean>>({});

  const displayChannels = channels?.length ? channels : SAMPLE_CHANNELS;

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${Math.round(n / 1000)}K`;
    return n.toString();
  };

  const launchChannel = async () => {
    if (!channelName.trim()) return;
    setLaunching(true);
    try {
      const res = await fetch("/api/stripe/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelName: channelName.trim(),
          email: "creator@versa.tv",
        }),
      });
      const data = await res.json();
      if (data.url && data.url !== "#") {
        window.open(data.url, "_blank");
      }
    } catch {
      // Demo fallback
    }
    setLaunching(false);
  };

  const heroChannel = displayChannels[0];
  const restChannels = displayChannels.slice(1);

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-4 pt-14 pb-24">
      <div className="max-w-md mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-5 animate-rise">
          <h2 className="font-display text-3xl font-bold mb-1 tracking-tight">
            Channels
          </h2>
          <p className="text-sm text-muted font-body">
            Expert-hosted. AI-produced. Revenue-split.
          </p>
        </div>

        {/* ── Horizontal scrolling stats bar ── */}
        <div className="mb-8 -mx-4 animate-rise" style={{ animationDelay: "0.05s" }}>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1">
            {STATS_BAR.map((stat) => (
              <div
                key={stat.label}
                className="flex-shrink-0 flex items-center gap-1.5 bg-[#101020] border border-[#1a1a30] rounded-full px-3.5 py-1.5"
              >
                <span className="text-sm font-bold font-display text-[#FFAB00]">
                  {stat.value}
                </span>
                <span className="text-[11px] text-[#8b8aa0] font-body">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Hero / Featured Channel (Versa TV Originals) ── */}
        <div
          className="relative mb-4 rounded-3xl overflow-hidden animate-slide-up"
          style={{ animationDelay: "0.08s" }}
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-coral/20 via-[#101020] to-gold/15" />
          <div className="absolute inset-0 border border-coral/15 rounded-3xl" />

          <div className="relative p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              {heroChannel.avatar_url ? (
                <img
                  src={heroChannel.avatar_url}
                  alt={heroChannel.name}
                  className="w-18 h-18 rounded-full object-cover border-2 border-coral/40 flex-shrink-0"
                />
              ) : (
                <div className="w-18 h-18 rounded-full bg-gradient-to-br from-coral to-gold flex items-center justify-center text-2xl font-bold font-display text-[#07070e] flex-shrink-0 border-2 border-coral/40">
                  {heroChannel.name.charAt(0)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="font-display font-bold text-lg text-[#f0eef5] truncate">
                    {heroChannel.name}
                  </h3>
                  {heroChannel.is_verified && (
                    <svg
                      className="w-4.5 h-4.5 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle cx="12" cy="12" r="10" fill="#6C5CE7" />
                      <path
                        d="M9 12l2 2 4-4"
                        stroke="#07070e"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-[#FFAB00] font-semibold font-body mb-1">
                  {formatCount(heroChannel.subscriber_count)} subscribers
                </p>
                <p className="text-xs text-[#8b8aa0] leading-relaxed font-body line-clamp-2">
                  {heroChannel.description}
                </p>

                {/* Mini feed preview */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex -space-x-1.5">
                    {MINI_FEED_GRADIENTS.map((gradient, i) => (
                      <div
                        key={i}
                        className={`w-7 h-7 rounded-full bg-gradient-to-br ${gradient} border-2 border-[#101020]`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#8b8aa0] font-body">
                    Recent dramas
                  </span>
                </div>
              </div>

              {/* Subscribe button */}
              <button
                onClick={() => setSubscribed((s) => ({ ...s, [heroChannel.id]: !s[heroChannel.id] }))}
                className={`mt-1 px-4 py-2 rounded-full text-xs font-bold font-body transition-all flex-shrink-0 active:scale-95 ${
                  subscribed[heroChannel.id]
                    ? "bg-coral text-white"
                    : "border border-coral text-coral hover:bg-coral/10"
                }`}
              >
                {subscribed[heroChannel.id] ? "Subscribed" : "Subscribe"}
              </button>
            </div>
          </div>
        </div>

        {/* ── Channel Cards ── */}
        <div className="space-y-3 mb-8">
          {restChannels.map((channel, i) => (
            <div
              key={channel.id}
              className="bg-[#101020] rounded-2xl p-4 animate-slide-up"
              style={{ animationDelay: `${0.12 + i * 0.05}s` }}
            >
              <div className="flex items-start gap-3.5">
                {/* Avatar */}
                {channel.avatar_url ? (
                  <img
                    src={channel.avatar_url}
                    alt={channel.name}
                    className="w-14 h-14 rounded-full object-cover border border-[#1a1a30] flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-coral/60 to-gold/60 flex items-center justify-center text-lg font-bold font-display text-[#07070e] flex-shrink-0 border border-[#1a1a30]">
                    {channel.name.charAt(0)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-semibold text-sm text-[#f0eef5] truncate font-body">
                      {channel.name}
                    </h3>
                    {channel.is_verified && (
                      <svg
                        className="w-3.5 h-3.5 flex-shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle cx="12" cy="12" r="10" fill="#3b82f6" />
                        <path
                          d="M9 12l2 2 4-4"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-[#8b8aa0] truncate font-body">
                    {channel.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-[#FFAB00] font-semibold font-body">
                      {formatCount(channel.subscriber_count)} subscribers
                    </span>
                    {/* Mini feed preview */}
                    <div className="flex -space-x-1">
                      {MINI_FEED_GRADIENTS.map((gradient, j) => (
                        <div
                          key={j}
                          className={`w-5 h-5 rounded-full bg-gradient-to-br ${gradient} border-[1.5px] border-[#101020]`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subscribe button */}
                <button
                  onClick={() => setSubscribed((s) => ({ ...s, [channel.id]: !s[channel.id] }))}
                  className={`mt-1 px-3.5 py-1.5 rounded-full text-xs font-bold font-body transition-all flex-shrink-0 active:scale-95 ${
                    subscribed[channel.id]
                      ? "bg-coral text-white"
                      : "border border-coral text-coral hover:bg-coral/10"
                  }`}
                >
                  {subscribed[channel.id] ? "Subscribed" : "Subscribe"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── Launch Your Channel ── */}
        {!showForm ? (
          <div
            className="relative rounded-2xl p-[1px] bg-gradient-to-r from-coral via-gold to-coral mb-8 animate-rise"
            style={{ animationDelay: "0.3s" }}
          >
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded-2xl bg-[#07070e] py-5 px-5 hover:bg-[#101020] transition-colors"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral to-gold flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#07070e]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </div>
                <span className="font-display font-bold text-lg text-[#f0eef5]">
                  Launch Your Channel
                </span>
                <span className="text-xs text-[#8b8aa0] font-body">
                  Start earning with AI-produced content
                </span>
              </div>
            </button>
          </div>
        ) : (
          <div
            className="relative rounded-2xl p-[1px] bg-gradient-to-r from-coral via-gold to-coral mb-8 animate-fade-in"
          >
            <div className="rounded-2xl bg-[#07070e] p-5">
              <h3 className="font-display font-bold text-lg text-[#f0eef5] mb-4 text-center">
                Launch Your Channel
              </h3>

              {/* Value prop rows */}
              <div className="space-y-3 mb-5">
                {/* AI produces */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#101020] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-coral" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714a2.25 2.25 0 0 0 .659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 0 1-1.59.659H9.06a2.25 2.25 0 0 1-1.591-.659L5 14.5m14 0V17a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2.5" />
                    </svg>
                  </div>
                  <span className="text-sm text-[#f0eef5] font-body">
                    AI produces your content
                  </span>
                </div>
                {/* Expertise */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#101020] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#FFAB00]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-[#f0eef5] font-body">
                    You bring the expertise
                  </span>
                </div>
                {/* Revenue */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#101020] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#00D2FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
                  </div>
                  <span className="text-sm text-[#f0eef5] font-body">
                    <span className="text-[#FFAB00] font-semibold">85% revenue share</span> from day one
                  </span>
                </div>
              </div>

              {/* Channel name input */}
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Your channel name"
                className="w-full bg-[#1a1a30] rounded-xl p-3.5 text-sm text-[#f0eef5] font-body placeholder:text-[#8b8aa0]/50 focus:outline-none focus:ring-2 focus:ring-coral/50 mb-4 border border-[#1a1a30] focus:border-coral/30 transition-colors"
              />

              {/* Buttons */}
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl bg-[#1a1a30] text-[#8b8aa0] font-semibold text-sm font-body hover:text-[#f0eef5] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={launchChannel}
                  disabled={launching || !channelName.trim()}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#635BFF] to-[#7C3AFF] text-white font-bold text-sm font-body transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {launching ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                      Launch with Stripe Connect
                    </>
                  )}
                </button>
              </div>

              {/* Stripe Connect badge */}
              <div className="flex items-center justify-center gap-1.5">
                <svg className="w-3 h-3 text-[#635BFF]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
                </svg>
                <span className="text-[10px] text-[#8b8aa0] font-body tracking-wide">
                  Powered by Stripe Connect
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom Stats (2x2 grid) ── */}
        <div
          className="grid grid-cols-2 gap-3 mb-5 animate-rise"
          style={{ animationDelay: "0.4s" }}
        >
          {BOTTOM_STATS.map((stat) => (
            <div
              key={stat.label}
              className="bg-[#101020] border border-[#1a1a30] rounded-2xl p-4 text-center"
            >
              <p className="text-2xl font-bold font-display text-[#FFAB00] mb-0.5">
                {stat.value}
              </p>
              <p className="text-[11px] text-[#8b8aa0] uppercase tracking-wider font-body">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Footer ── */}
        <p
          className="text-center text-[10px] text-[#8b8aa0]/60 font-body leading-relaxed mb-4 animate-rise"
          style={{ animationDelay: "0.5s" }}
        >
          Powered by Filmology Labs &mdash; 250,000 sq ft production facility, Paterson, NJ
        </p>

      </div>
    </div>
  );
}
