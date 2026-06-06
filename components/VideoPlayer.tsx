"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface VideoPlayerProps {
  src: string | null;
  poster?: string | null;
  posterUrl?: string | null;
  gradient?: string;
  isVisible: boolean;
  title: string;
  onProgress?: (sec: number) => void;
  initialProgress?: number;
}

export default function VideoPlayer({
  src,
  poster,
  posterUrl,
  gradient,
  isVisible,
  title,
  onProgress,
  initialProgress,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showPlayPause, setShowPlayPause] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const playPauseTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const progressTimer = useRef<ReturnType<typeof setInterval>>(undefined);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const kenBurnsPhase = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (isVisible) {
      if (initialProgress && video.currentTime === 0) {
        video.currentTime = initialProgress;
      }
      video.play().catch(() => {});
      setIsPlaying(true);

      progressTimer.current = setInterval(() => {
        setProgress(video.currentTime);
        setDuration(video.duration || 0);
        onProgress?.(video.currentTime);
      }, 250);
    } else {
      video.pause();
      setIsPlaying(false);
      if (progressTimer.current) clearInterval(progressTimer.current);
    }

    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [isVisible, src, initialProgress, onProgress]);

  // Ken Burns: cycle through phases for poster-only mode
  useEffect(() => {
    if (src || !isVisible) return;
    const interval = setInterval(() => {
      kenBurnsPhase.current = (kenBurnsPhase.current + 1) % 3;
    }, 8000);
    return () => clearInterval(interval);
  }, [src, isVisible]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }

    // Show the play/pause indicator briefly
    setShowPlayPause(true);
    if (playPauseTimeout.current) clearTimeout(playPauseTimeout.current);
    playPauseTimeout.current = setTimeout(() => setShowPlayPause(false), 800);
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const bar = progressBarRef.current;
      const video = videoRef.current;
      if (!bar || !video || !duration) return;
      const rect = bar.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      video.currentTime = fraction * duration;
      setProgress(video.currentTime);
    },
    [duration]
  );

  const handleProgressDrag = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation();
      const bar = progressBarRef.current;
      const video = videoRef.current;
      if (!bar || !video || !duration) return;
      const touch = e.touches[0];
      const rect = bar.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
      video.currentTime = fraction * duration;
      setProgress(video.currentTime);
    },
    [duration]
  );

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  // ---- Poster-only mode (no video_url) ----
  if (!src) {
    const hasPoster = !!posterUrl;
    return (
      <div className="absolute inset-0 overflow-hidden bg-[#0A0A0F]">
        {/* Background: poster image or gradient */}
        {hasPoster ? (
          <img
            src={posterUrl!}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[8000ms] ease-in-out"
            style={{
              transform: isVisible ? "scale(1.08)" : "scale(1)",
              willChange: "transform",
            }}
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-b ${gradient || "from-gray-900 to-black"}`}
            style={{
              transform: isVisible ? "scale(1.05)" : "scale(1)",
              transition: "transform 8s ease-in-out",
            }}
          />
        )}

        {/* Cinematic vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full animate-[ring_2s_ease-in-out_infinite] scale-100" />
            <div className="w-18 h-18 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xl">
              <svg
                className="w-8 h-8 text-white ml-1 drop-shadow-lg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* "Coming Soon" label for poster-only */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2">
          <span className="text-[10px] font-body uppercase tracking-[0.2em] text-white/40 bg-white/5 px-3 py-1 rounded-full backdrop-blur-sm">
            Preview
          </span>
        </div>
      </div>
    );
  }

  // ---- Video playback mode ----
  return (
    <div className="absolute inset-0 bg-black" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={src}
        poster={poster || posterUrl || undefined}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
      />

      {/* Play/Pause toggle animation overlay */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
          showPlayPause ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transform transition-transform duration-300 scale-100">
          {isPlaying ? (
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </div>
      </div>

      {/* Paused dim overlay */}
      {!isPlaying && !showPlayPause && (
        <div className="absolute inset-0 bg-black/30 transition-opacity duration-500" />
      )}

      {/* Muted indicator */}
      <button
        onClick={toggleMute}
        className="absolute top-14 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center z-20"
      >
        {isMuted ? (
          <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>

      {/* Progress bar with scrubber */}
      {duration > 0 && (
        <div
          ref={progressBarRef}
          className="absolute bottom-0 left-0 right-0 h-6 flex items-end z-10 cursor-pointer group"
          onClick={handleProgressClick}
          onTouchMove={handleProgressDrag}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
        >
          {/* Track background */}
          <div className="w-full h-[3px] bg-white/10 group-hover:h-[5px] transition-all duration-200 relative">
            {/* Filled portion */}
            <div
              className="absolute top-0 left-0 h-full bg-[#FF3D6E] transition-[width] duration-200"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Scrubber dot */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#FF3D6E] shadow-lg shadow-[#FF3D6E]/30 transition-opacity duration-200 ${
                isDragging ? "opacity-100 scale-125" : "opacity-0 group-hover:opacity-100"
              }`}
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
