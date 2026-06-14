import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SAMPLE_DRAMAS, SAMPLE_EPISODES } from "@/lib/sampleData";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function findDrama(slug: string) {
  return SAMPLE_DRAMAS.find((d) => slugify(d.title) === slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ series: string }>;
}): Promise<Metadata> {
  const { series } = await params;
  const drama = findDrama(series);
  if (!drama) return { title: "Series Not Found | Versa TV" };

  return {
    title: `${drama.title} | Versa TV`,
    description: drama.logline,
    openGraph: {
      title: `${drama.title} | Versa TV`,
      description: drama.logline,
      type: "video.tv_show",
      siteName: "Versa TV",
      images: drama.poster_url ? [{ url: drama.poster_url }] : undefined,
    },
  };
}

export function generateStaticParams() {
  return SAMPLE_DRAMAS.map((d) => ({ series: slugify(d.title) }));
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ series: string }>;
}) {
  const { series } = await params;
  const drama = findDrama(series);
  if (!drama) notFound();

  const episodes = SAMPLE_EPISODES.filter((e) => e.drama_id === drama.id)
    .sort((a, b) => a.episode_number - b.episode_number);
  const channel = drama.channel;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: drama.title,
    description: drama.logline,
    genre: drama.genre,
    numberOfEpisodes: drama.total_episodes,
    image: drama.poster_url,
    publisher: {
      "@type": "Organization",
      name: channel?.name || "Versa TV",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen bg-[#07070e] text-[#f0eef5]">
        {/* Hero */}
        <div className="relative w-full aspect-video max-h-[50vh] overflow-hidden">
          {drama.poster_url && (
            <img src={drama.poster_url} alt={drama.title} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07070e] via-[#07070e]/50 to-transparent" />
          <div className="absolute top-4 left-4">
            <a href="/" className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm text-white text-sm font-body border border-white/10">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Versa TV
            </a>
          </div>
        </div>

        <div className="px-5 py-6 max-w-lg mx-auto">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#6C5CE7]/15 text-[10px] font-bold text-[#6C5CE7] uppercase tracking-wider mb-3">
            {drama.genre}
          </span>
          <h1 className="font-display text-3xl font-bold leading-tight mb-3">{drama.title}</h1>
          <p className="text-sm text-[#f0eef5]/70 font-body leading-relaxed mb-6">{drama.logline}</p>

          {channel && (
            <div className="flex items-center gap-2 mb-6">
              {channel.avatar_url ? (
                <img src={channel.avatar_url} alt={channel.name} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/20 flex items-center justify-center text-xs font-bold text-[#6C5CE7]">
                  {channel.name.charAt(0)}
                </div>
              )}
              <span className="text-sm font-body text-[#f0eef5]/80">{channel.name}</span>
            </div>
          )}

          <h2 className="font-display text-lg font-bold mb-4">{episodes.length} Episodes</h2>

          <div className="space-y-3">
            {episodes.map((ep) => (
              <a
                key={ep.id}
                href={`/watch/${series}/${ep.episode_number}`}
                className="block bg-[#101020] rounded-2xl p-4 border border-[#1a1a30] hover:border-[#6C5CE7]/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#6C5CE7]/10 flex items-center justify-center text-[#6C5CE7] font-bold text-sm flex-shrink-0">
                    {ep.episode_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-[#f0eef5] font-body truncate">{ep.title}</h3>
                    <p className="text-[11px] text-[#8b8aa0] font-body line-clamp-1">{ep.synopsis}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {ep.locked ? (
                      <span className="text-[10px] font-bold text-[#FFAB00] flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" />
                        </svg>
                        {Math.max(30, Math.floor(ep.price_cents / 10))} coins
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#00D2FF]">Free</span>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-8 text-center">
            <a href="/" className="inline-block w-full py-4 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#FFAB00] text-[#07070e] font-bold text-base font-body">
              Watch on Versa TV
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
