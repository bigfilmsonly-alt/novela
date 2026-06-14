import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SAMPLE_DRAMAS, SAMPLE_EPISODES } from "@/lib/sampleData";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function findDrama(seriesSlug: string) {
  return SAMPLE_DRAMAS.find((d) => slugify(d.title) === seriesSlug);
}

function findEpisode(dramaId: string, epNum: number) {
  return SAMPLE_EPISODES.find(
    (e) => e.drama_id === dramaId && e.episode_number === epNum
  );
}

/* ------------------------------------------------------------------ */
/*  Metadata (SSR)                                                     */
/* ------------------------------------------------------------------ */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ series: string; ep: string }>;
}): Promise<Metadata> {
  const { series, ep } = await params;
  const drama = findDrama(series);
  if (!drama) return { title: "Episode Not Found | Versa TV" };

  const epNum = parseInt(ep, 10);
  const episode = findEpisode(drama.id, epNum);
  if (!episode) return { title: "Episode Not Found | Versa TV" };

  const title = `${drama.title} — Ep. ${epNum}: ${episode.title} | Versa TV`;
  const description = episode.synopsis;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "video.episode",
      siteName: "Versa TV",
      images: episode.poster_url || drama.poster_url
        ? [{ url: (episode.poster_url || drama.poster_url)!, width: 800, height: 1400 }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Static params for pre-rendering                                    */
/* ------------------------------------------------------------------ */
export function generateStaticParams() {
  return SAMPLE_DRAMAS.flatMap((drama) => {
    const seriesSlug = slugify(drama.title);
    return Array.from({ length: drama.total_episodes }, (_, i) => ({
      series: seriesSlug,
      ep: String(i + 1),
    }));
  });
}

/* ------------------------------------------------------------------ */
/*  Page component (SSR)                                               */
/* ------------------------------------------------------------------ */
export default async function EpisodePage({
  params,
}: {
  params: Promise<{ series: string; ep: string }>;
}) {
  const { series, ep } = await params;
  const drama = findDrama(series);
  if (!drama) notFound();

  const epNum = parseInt(ep, 10);
  const episode = findEpisode(drama.id, epNum);
  if (!episode) notFound();

  const channel = drama.channel;
  const posterUrl = episode.poster_url || drama.poster_url;
  const coinPrice = Math.max(30, Math.floor(episode.price_cents / 10));

  // JSON-LD VideoObject + TVEpisode schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["VideoObject", "TVEpisode"],
    name: `${drama.title} — ${episode.title}`,
    description: episode.synopsis,
    thumbnailUrl: posterUrl,
    uploadDate: episode.created_at,
    duration: episode.duration_sec ? `PT${episode.duration_sec}S` : undefined,
    episodeNumber: episode.episode_number,
    partOfSeries: {
      "@type": "TVSeries",
      name: drama.title,
      description: drama.logline,
      genre: drama.genre,
      numberOfEpisodes: drama.total_episodes,
    },
    publisher: {
      "@type": "Organization",
      name: channel?.name || "Versa TV",
      url: "https://novela-saas-agency.vercel.app",
    },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/WatchAction",
        userInteractionCount: episode.view_count,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: episode.like_count,
      },
    ],
    ...(episode.video_url && !episode.locked
      ? { contentUrl: episode.video_url, encodingFormat: "video/mp4" }
      : { isAccessibleForFree: false }),
  };

  return (
    <>
      {/* JSON-LD for search engines and AI assistants */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#07070e] text-[#f0eef5]">
        {/* Hero poster */}
        <div className="relative w-full aspect-[9/16] max-h-[70vh] overflow-hidden">
          {posterUrl && (
            <img
              src={posterUrl}
              alt={`${drama.title} - ${episode.title}`}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07070e] via-[#07070e]/40 to-transparent" />

          {/* Back to app CTA */}
          <div className="absolute top-4 left-4 z-10">
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm font-body border border-white/10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Open in App
            </a>
          </div>

          {/* Play button overlay */}
          {!episode.locked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <a
                href="/"
                className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20"
              >
                <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </a>
            </div>
          )}

          {/* Lock overlay for paid episodes */}
          {episode.locked && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[#FFAB00]/20 border border-[#FFAB00]/30 flex items-center justify-center">
                  <svg className="w-7 h-7 text-[#FFAB00]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                  </svg>
                </div>
                <p className="text-lg font-display font-bold text-[#FFAB00]">
                  {coinPrice} coins to unlock
                </p>
                <a
                  href="/"
                  className="inline-block mt-3 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#FFAB00] to-[#FF8C00] text-[#07070e] font-bold text-sm"
                >
                  Open App to Unlock
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Episode info */}
        <div className="px-5 py-6 max-w-lg mx-auto">
          {/* Channel */}
          <div className="flex items-center gap-2 mb-3">
            {channel?.avatar_url ? (
              <img src={channel.avatar_url} alt={channel.name} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/20 flex items-center justify-center text-xs font-bold text-[#6C5CE7]">
                {channel?.name?.charAt(0) || "V"}
              </div>
            )}
            <span className="text-sm font-body font-medium text-[#f0eef5]/80">
              {channel?.name || "Versa TV"}
            </span>
            {channel?.is_verified && (
              <svg className="w-4 h-4 text-[#6C5CE7]" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="currentColor" />
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          {/* Title */}
          <h1 className="font-display text-2xl font-bold leading-tight mb-1">
            {drama.title}
          </h1>
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2.5 py-0.5 rounded-full bg-[#6C5CE7]/15 text-[10px] font-bold text-[#6C5CE7] uppercase tracking-wider">
              {drama.genre}
            </span>
            <span className="text-[11px] text-[#8b8aa0] font-body">
              Ep. {episode.episode_number} — {episode.title}
            </span>
            {episode.duration_sec && (
              <span className="text-[11px] text-[#8b8aa0] font-body">
                · {Math.floor(episode.duration_sec / 60)}:{String(episode.duration_sec % 60).padStart(2, "0")}
              </span>
            )}
          </div>

          {/* Synopsis */}
          <p className="text-sm text-[#f0eef5]/70 font-body leading-relaxed mb-6">
            {episode.synopsis}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-6 text-xs text-[#8b8aa0] font-body">
            <span>{episode.view_count.toLocaleString()} views</span>
            <span>{episode.like_count.toLocaleString()} likes</span>
          </div>

          {/* Series info */}
          <div className="bg-[#101020] rounded-2xl p-5 border border-[#1a1a30]">
            <h2 className="font-display text-base font-bold mb-2">About this series</h2>
            <p className="text-sm text-[#f0eef5]/70 font-body leading-relaxed mb-3">
              {drama.logline}
            </p>
            <p className="text-xs text-[#8b8aa0] font-body">
              {drama.total_episodes} episodes · First {Math.min(2, drama.total_episodes)} free
            </p>
          </div>

          {/* CTA */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="inline-block w-full py-4 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#FFAB00] text-[#07070e] font-bold text-base font-body tracking-wide"
            >
              Watch on Versa TV
            </a>
            <p className="text-[10px] text-[#8b8aa0]/50 font-body mt-3">
              Versa TV — AI-powered vertical micro-dramas
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
