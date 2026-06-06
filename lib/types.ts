export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Channel {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  stripe_account_id: string | null;
  subscriber_count: number;
  is_verified: boolean;
  created_at: string;
}

export interface Drama {
  id: string;
  channel_id: string;
  title: string;
  logline: string;
  genre: string;
  poster_gradient: string;
  poster_url: string | null;
  total_episodes: number;
  status: "draft" | "published" | "archived";
  created_at: string;
  channel?: Channel;
  episodes?: Episode[];
}

export interface Episode {
  id: string;
  drama_id: string;
  episode_number: number;
  title: string;
  synopsis: string;
  video_url: string | null;
  poster_url: string | null;
  duration_sec: number | null;
  locked: boolean;
  price_cents: number;
  view_count: number;
  like_count: number;
  created_at: string;
  drama?: Drama;
}

export interface WatchProgress {
  id: string;
  user_id: string;
  episode_id: string;
  progress_sec: number;
  completed: boolean;
  updated_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  episode_id: string;
  created_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  premise: string;
  result: object;
  model: string;
  created_at: string;
}

export interface Earning {
  id: string;
  channel_id: string;
  episode_id: string;
  amount_cents: number;
  platform_fee_cents: number;
  stripe_payment_id: string;
  created_at: string;
}

export type TabId = "feed" | "host" | "studio" | "channels";

export interface GeneratedDrama {
  title: string;
  logline: string;
  genre: string;
  episodes: {
    episode_number: number;
    title: string;
    synopsis: string;
    cold_open: string;
    cliffhanger: string;
  }[];
}

export interface HostSegment {
  greeting: string;
  recap: string;
  trending: string;
  recommendation: string;
  signoff: string;
}
