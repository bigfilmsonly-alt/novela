import type { MetadataRoute } from "next";
import { SAMPLE_DRAMAS, SAMPLE_EPISODES } from "@/lib/sampleData";

const BASE_URL = "https://versa.tv";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/ai-host`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/studio`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/channels`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  // Series pages: /watch/[slug]
  const seriesPages: MetadataRoute.Sitemap = SAMPLE_DRAMAS.map((drama) => ({
    url: `${BASE_URL}/watch/${slugify(drama.title)}`,
    lastModified: new Date(drama.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  // Episode pages: /watch/[series-slug]/[episode-number]
  const episodePages: MetadataRoute.Sitemap = SAMPLE_EPISODES.map(
    (episode) => {
      const drama = SAMPLE_DRAMAS.find((d) => d.id === episode.drama_id);
      const seriesSlug = drama ? slugify(drama.title) : "unknown";
      return {
        url: `${BASE_URL}/watch/${seriesSlug}/${episode.episode_number}`,
        lastModified: new Date(episode.created_at),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      };
    }
  );

  return [...staticPages, ...seriesPages, ...episodePages];
}
