"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { Episode } from "@/lib/types";
import { SAMPLE_EPISODES } from "@/lib/sampleData";
import FeedCard from "./FeedCard";

interface FeedProps {
  episodes?: Episode[];
}

/* ---- Skeleton shimmer card ---- */
function FeedSkeleton() {
  return (
    <div className="snap-card relative w-full h-dvh flex-shrink-0 bg-[#0A0A0F]">
      {/* Shimmer background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#14141C] via-[#1E1E2A] to-[#14141C] bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" />
      {/* Bottom panel skeleton */}
      <div className="absolute bottom-0 left-0 right-16 p-4 pb-24 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-white/5" />
          <div className="h-3 w-24 rounded-full bg-white/5" />
        </div>
        <div className="h-5 w-48 rounded bg-white/5" />
        <div className="flex gap-2">
          <div className="h-5 w-14 rounded-full bg-white/5" />
          <div className="h-5 w-20 rounded-full bg-white/5" />
        </div>
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-3/4 rounded bg-white/5" />
      </div>
      {/* Right bar skeleton */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-11 h-11 rounded-full bg-white/5" />
        ))}
      </div>
    </div>
  );
}

export default function Feed({ episodes }: FeedProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const feedEpisodes = episodes?.length
    ? episodes
    : SAMPLE_EPISODES.filter((e) => !e.locked);

  // ---- IntersectionObserver for visible card tracking ----
  useEffect(() => {
    const container = feedRef.current;
    if (!container) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-index"));
            if (!isNaN(idx)) {
              setVisibleIndex(idx);
            }
          }
        }
      },
      {
        root: container,
        threshold: 0.5,
      }
    );

    // Observe all card elements
    cardRefs.current.forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [feedEpisodes.length]);

  // Ref callback for each card
  const setCardRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      cardRefs.current.set(index, el);
      observerRef.current?.observe(el);
    } else {
      const existing = cardRefs.current.get(index);
      if (existing) observerRef.current?.unobserve(existing);
      cardRefs.current.delete(index);
    }
  }, []);

  // ---- Show skeleton on fast scroll ----
  useEffect(() => {
    const container = feedRef.current;
    if (!container) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      setShowSkeleton(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setShowSkeleton(false), 150);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  // ---- Pull to refresh ----
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = feedRef.current;
    if (!container) return;
    if (container.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.4, 80));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance > 60) {
      setIsRefreshing(true);
      // Simulate refresh
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1200);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance]);

  // ---- Preload adjacent images ----
  useEffect(() => {
    const preloadImage = (url: string | null | undefined) => {
      if (!url) return;
      const img = new Image();
      img.src = url;
    };

    // Preload next card's poster
    if (visibleIndex + 1 < feedEpisodes.length) {
      const next = feedEpisodes[visibleIndex + 1];
      preloadImage(next.poster_url || next.drama?.poster_url);
    }
    // Preload previous card's poster
    if (visibleIndex - 1 >= 0) {
      const prev = feedEpisodes[visibleIndex - 1];
      preloadImage(prev.poster_url || prev.drama?.poster_url);
    }
  }, [visibleIndex, feedEpisodes]);

  // Count episodes per drama for progress dots
  const getEpisodesInSeries = useCallback(
    (dramaId: string) => {
      return feedEpisodes.filter((e) => e.drama_id === dramaId).length;
    },
    [feedEpisodes]
  );

  return (
    <div className="relative h-full">
      {/* Pull-to-refresh indicator */}
      <div
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center overflow-hidden transition-all duration-300"
        style={{ height: isRefreshing ? 48 : pullDistance }}
      >
        <div
          className={`flex items-center gap-2 transition-opacity duration-200 ${
            pullDistance > 20 || isRefreshing ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`w-5 h-5 border-2 border-[#FF3D6E] border-t-transparent rounded-full ${
              isRefreshing ? "animate-spin" : ""
            }`}
            style={{
              transform: isRefreshing
                ? undefined
                : `rotate(${pullDistance * 4}deg)`,
            }}
          />
          <span className="text-xs text-[#9A93A6] font-body">
            {isRefreshing
              ? "Refreshing..."
              : pullDistance > 60
                ? "Release to refresh"
                : "Pull to refresh"}
          </span>
        </div>
      </div>

      {/* Feed scroll container */}
      <div
        ref={feedRef}
        className="snap-feed h-full overflow-y-auto no-scrollbar"
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? "transform 0.3s ease-out" : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {feedEpisodes.map((episode, i) => (
          <div
            key={episode.id}
            ref={(el) => setCardRef(i, el)}
            data-index={i}
          >
            <FeedCard
              episode={episode}
              isVisible={i === visibleIndex}
              isFirst={i === 0}
              totalEpisodesInSeries={getEpisodesInSeries(episode.drama_id)}
            />
          </div>
        ))}

        {/* Bottom skeleton (loading more) */}
        {showSkeleton && visibleIndex >= feedEpisodes.length - 2 && (
          <FeedSkeleton />
        )}
      </div>
    </div>
  );
}
