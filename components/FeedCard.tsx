"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Episode } from "@/lib/types";
import VideoPlayer from "./VideoPlayer";

interface FeedCardProps {
  episode: Episode;
  isVisible: boolean;
  shouldLoadVideo?: boolean;
  isFirst?: boolean;
  totalEpisodesInSeries?: number;
  onOpenComments?: (title: string) => void;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) {
    const val = n / 1_000_000;
    return val >= 10 ? `${Math.floor(val)}M` : `${val.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 1_000) {
    const val = n / 1_000;
    return val >= 10 ? `${Math.floor(val)}K` : `${val.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return n.toString();
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function FeedCard({
  episode,
  isVisible,
  shouldLoadVideo = true,
  isFirst = false,
  totalEpisodesInSeries,
  onOpenComments,
}: FeedCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(episode.like_count);
  const [bookmarked, setBookmarked] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showUnlockToast, setShowUnlockToast] = useState(false);
  const [showDoubleTapHeart, setDoubleTapHeart] = useState(false);
  const [heartScale, setHeartScale] = useState(false);
  const lastTap = useRef(0);
  const doubleTapTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const cardRef = useRef<HTMLDivElement>(null);

  const drama = episode.drama;
  const channel = drama?.channel;
  const totalEps = totalEpisodesInSeries || drama?.total_episodes || 4;
  const posterUrl = episode.poster_url || drama?.poster_url;

  // Cleanup double-tap timer
  useEffect(() => {
    return () => {
      if (doubleTapTimer.current) clearTimeout(doubleTapTimer.current);
    };
  }, []);

  const triggerLike = useCallback(() => {
    if (!liked) {
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
    // Show heart animation
    setDoubleTapHeart(true);
    setHeartScale(true);
    setTimeout(() => setHeartScale(false), 400);
    if (doubleTapTimer.current) clearTimeout(doubleTapTimer.current);
    doubleTapTimer.current = setTimeout(() => setDoubleTapHeart(false), 900);
  }, [liked]);

  const toggleLike = useCallback(() => {
    setLiked((prev) => {
      setLikeCount((c) => (prev ? c - 1 : c + 1));
      return !prev;
    });
    // Trigger heart bounce
    setHeartScale(true);
    setTimeout(() => setHeartScale(false), 300);
  }, []);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      triggerLike();
    }
    lastTap.current = now;
  }, [triggerLike]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: drama?.title || "Check this out on Versa TV",
      text: episode.synopsis,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.url}`);
      } catch {}
    }
  }, [drama?.title, episode.synopsis]);

  // Episode progress dots
  const episodeDots = [];
  for (let i = 1; i <= totalEps; i++) {
    episodeDots.push(
      <div
        key={i}
        className={`h-[3px] rounded-full transition-all duration-500 ${
          i === episode.episode_number
            ? "w-6 bg-[#6C5CE7]"
            : i < episode.episode_number
              ? "w-3 bg-white/50"
              : "w-3 bg-white/20"
        }`}
      />
    );
  }

  return (
    <div
      ref={cardRef}
      className="snap-card relative w-full flex-shrink-0 overflow-hidden bg-[#07070e]"
      onTouchEnd={handleDoubleTap}
      onClick={handleDoubleTap}
    >
      {/* ---- Poster Image Background ---- */}
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading={isVisible ? "eager" : "lazy"}
          draggable={false}
        />
      )}

      {/* ---- Video / Gradient Poster layer ---- */}
      {shouldLoadVideo && (
        <VideoPlayer
          src={episode.video_url}
          posterUrl={posterUrl}
          gradient={drama?.poster_gradient}
          isVisible={isVisible}
          title={episode.title}
        />
      )}

      {/* ---- Cinematic vignette overlays ---- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Bottom vignette - strong */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80" />
        {/* Top vignette - subtle */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent opacity-60" />
        {/* Side vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,rgba(0,0,0,0.3)_100%)]" />
      </div>

      {/* ---- Episode Progress Dots (top) ---- */}
      <div className="absolute top-12 left-0 right-0 z-20 flex items-center justify-center gap-1.5 px-12 animate-[fade-in_0.3s_ease-out_both]">
        {episodeDots}
      </div>

      {/* ---- Double-tap heart animation ---- */}
      {showDoubleTapHeart && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <svg
            className={`w-24 h-24 text-[#6C5CE7] drop-shadow-2xl transition-all duration-300 ${
              heartScale ? "scale-110 opacity-100" : "scale-75 opacity-0"
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </div>
      )}

      {/* ---- Locked Episode Overlay (Coin Economy) ---- */}
      {episode.locked && (
        <div className="absolute inset-0 z-25 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center px-8 animate-[rise_0.6s_ease-out_both]">
            {/* Coin icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FFAB00]/20 to-[#6C5CE7]/20 border border-[#FFAB00]/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#FFAB00]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <text x="12" y="16" textAnchor="middle" fontSize="12" fontWeight="bold" fill="currentColor">C</text>
              </svg>
            </div>
            <p className="text-sm font-body text-[#8b8aa0] mb-1">Episode {episode.episode_number} is locked</p>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-2xl font-display font-bold text-[#FFAB00]">
                {Math.max(30, Math.floor(episode.price_cents / 10))}
              </span>
              <span className="text-sm font-body font-medium text-[#FFAB00]/70">coins</span>
            </div>
            <p className="text-[11px] text-[#8b8aa0]/50 font-body mb-4">
              ≈ ${(Math.max(30, Math.floor(episode.price_cents / 10)) * 0.02).toFixed(2)}
            </p>

            {/* Unlock button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUnlockToast(true);
                setTimeout(() => setShowUnlockToast(false), 2500);
              }}
              className="w-full px-8 py-3.5 rounded-full bg-gradient-to-r from-[#FFAB00] to-[#FF8C00] text-[#07070e] font-body font-bold text-sm shadow-lg shadow-[#FFAB00]/20 active:scale-95 transition-all duration-150 hover:brightness-110 mb-2"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
                Unlock with Coins
              </span>
            </button>

            {/* Buy coins CTA */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowUnlockToast(true);
                setTimeout(() => setShowUnlockToast(false), 2500);
              }}
              className="px-6 py-2 rounded-full bg-white/8 backdrop-blur-sm text-white/80 font-body text-xs font-medium border border-white/10 active:scale-95 transition-all"
            >
              Get Coins — Starting at $1.99
            </button>

            {showUnlockToast ? (
              <p className="text-[11px] text-[#00D2FF] mt-3 font-body font-semibold animate-[fade-in_0.2s_ease-out]">
                Sign in to purchase coins & unlock
              </p>
            ) : (
              <p className="text-[11px] text-[#8b8aa0]/40 mt-3 font-body">
                Unlock once, watch forever · Season Pass available
              </p>
            )}
          </div>
        </div>
      )}

      {/* ---- Bottom Info Panel ---- */}
      <div className="absolute bottom-0 left-0 right-16 z-20 p-4 pb-20">
        <div className="animate-[rise_0.6s_ease-out_both]">
          {/* Channel row */}
          <div className="flex items-center gap-2 mb-2.5">
            {/* Channel avatar */}
            <div className="w-9 h-9 rounded-full overflow-hidden bg-[#1a1a30] flex items-center justify-center flex-shrink-0 border border-white/10">
              {channel?.avatar_url ? (
                <img
                  src={channel.avatar_url}
                  alt={channel.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-[#6C5CE7] font-body">
                  {channel?.name?.charAt(0) || "N"}
                </span>
              )}
            </div>
            <span className="text-[13px] font-semibold text-[#f0eef5] font-body tracking-wide">
              {channel?.name || "Versa TV"}
            </span>
            {channel?.is_verified && (
              <svg className="w-4 h-4 text-[#6C5CE7] flex-shrink-0" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor" />
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          {/* Drama title */}
          <h3 className="font-display text-xl font-bold leading-tight text-[#f0eef5] mb-1">
            {drama?.title || "Untitled"}
          </h3>

          {/* Episode pill + Genre tag + Duration */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {/* Episode number pill */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-[11px] font-body font-medium text-[#f0eef5]/90 tracking-wide">
              EP. {episode.episode_number}
            </span>
            {/* Genre tag */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#6C5CE7]/15 text-[11px] font-body font-semibold text-[#6C5CE7] uppercase tracking-wider">
              {drama?.genre}
            </span>
            {/* Duration */}
            {episode.duration_sec && (
              <span className="text-[11px] text-[#8b8aa0] font-body">
                {formatDuration(episode.duration_sec)}
              </span>
            )}
          </div>

          {/* Synopsis */}
          <p className="text-[13px] font-body text-[#f0eef5]/70 leading-relaxed line-clamp-2">
            {episode.synopsis}
          </p>
        </div>
      </div>

      {/* ---- Right Action Bar ---- */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-5 animate-[fade-in_0.3s_ease-out_0.2s_both]">
        {/* Like */}
        <button onClick={(e) => { e.stopPropagation(); toggleLike(); }} className="flex flex-col items-center gap-1 group">
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
              liked
                ? "bg-[#6C5CE7] shadow-lg shadow-[#6C5CE7]/30"
                : "bg-white/10 backdrop-blur-sm border border-white/10"
            }`}
          >
            <svg
              className={`w-5 h-5 text-white transition-transform duration-200 ${
                heartScale ? "scale-125" : "scale-100"
              }`}
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={liked ? 0 : 2}
              viewBox="0 0 24 24"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="text-[11px] text-[#f0eef5]/70 font-body tabular-nums">
            {formatCount(likeCount)}
          </span>
        </button>

        {/* Comments */}
        <button onClick={(e) => { e.stopPropagation(); onOpenComments?.(drama?.title || episode.title); }} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-[11px] text-[#f0eef5]/70 font-body tabular-nums">
            {formatCount(Math.floor(episode.view_count / 12))}
          </span>
        </button>

        {/* Share */}
        <button onClick={(e) => { e.stopPropagation(); handleShare(); }} className="flex flex-col items-center gap-1">
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </div>
          <span className="text-[11px] text-[#f0eef5]/70 font-body">Share</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            const next = !bookmarked;
            setBookmarked(next);
            if (next) {
              setShowSaveToast(true);
              setTimeout(() => setShowSaveToast(false), 1500);
            }
          }}
          className="flex flex-col items-center gap-1"
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
              bookmarked
                ? "bg-[#FFAB00] shadow-lg shadow-[#FFAB00]/20"
                : "bg-white/10 backdrop-blur-sm border border-white/10"
            }`}
          >
            <svg
              className="w-5 h-5 text-white"
              fill={bookmarked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={bookmarked ? 0 : 2}
              viewBox="0 0 24 24"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <span className="text-[11px] text-[#f0eef5]/70 font-body">
            {bookmarked ? "Saved" : "Save"}
          </span>
        </button>
      </div>

      {/* ---- Save Toast ---- */}
      {showSaveToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-[#FFAB00] text-[#07070e] text-xs font-bold font-body animate-[slide-up_0.3s_ease-out] shadow-lg">
          Saved to your list
        </div>
      )}

      {/* ---- Watching Now (social proof) ---- */}
      {isVisible && !episode.locked && (
        <div className="absolute top-12 right-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm animate-[fade-in_0.5s_ease-out_0.5s_both]">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D2FF] opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00D2FF]" />
          </span>
          <span className="text-[9px] text-white/70 font-body tabular-nums">
            {formatCount((episode.view_count % 800) + 200)} watching
          </span>
        </div>
      )}

      {/* ---- Swipe Up Indicator (first card only) ---- */}
      {isFirst && isVisible && (
        <div className="absolute bottom-5 left-0 right-0 z-20 flex flex-col items-center gap-1 animate-[fade-in_0.3s_ease-out_1s_both]">
          <svg
            className="w-5 h-5 text-white/40 animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
          <span className="text-[10px] text-white/30 font-body uppercase tracking-[0.2em]">
            Swipe up for next
          </span>
        </div>
      )}
    </div>
  );
}
