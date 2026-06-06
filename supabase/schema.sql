-- NOVELA: AI-Produced Vertical Micro-Drama Platform
-- Run this in the Supabase SQL editor

-- Profiles
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Channels
create table if not exists channels (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  slug text unique not null,
  description text,
  avatar_url text,
  stripe_account_id text,
  subscriber_count int default 0,
  is_verified boolean default false,
  created_at timestamptz default now()
);

alter table channels enable row level security;
create policy "Channels are viewable by everyone" on channels for select using (true);
create policy "Users can create own channels" on channels for insert with check (auth.uid() = owner_id);
create policy "Users can update own channels" on channels for update using (auth.uid() = owner_id);

-- Dramas (series)
create table if not exists dramas (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references channels(id) on delete cascade not null,
  title text not null,
  logline text not null,
  genre text not null,
  poster_gradient text default 'from-gray-900 to-black',
  poster_url text,
  total_episodes int default 4,
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz default now()
);

alter table dramas enable row level security;
create policy "Published dramas are viewable" on dramas for select using (status = 'published' or exists (
  select 1 from channels where channels.id = dramas.channel_id and channels.owner_id = auth.uid()
));
create policy "Channel owners can insert dramas" on dramas for insert with check (exists (
  select 1 from channels where channels.id = dramas.channel_id and channels.owner_id = auth.uid()
));
create policy "Channel owners can update dramas" on dramas for update using (exists (
  select 1 from channels where channels.id = dramas.channel_id and channels.owner_id = auth.uid()
));

-- Episodes
create table if not exists episodes (
  id uuid primary key default gen_random_uuid(),
  drama_id uuid references dramas(id) on delete cascade not null,
  episode_number int not null,
  title text not null,
  synopsis text,
  video_url text,
  poster_url text,
  duration_sec int,
  locked boolean default false,
  price_cents int default 0,
  view_count int default 0,
  like_count int default 0,
  created_at timestamptz default now(),
  unique(drama_id, episode_number)
);

alter table episodes enable row level security;
create policy "Episodes of published dramas are viewable" on episodes for select using (exists (
  select 1 from dramas where dramas.id = episodes.drama_id and (dramas.status = 'published' or exists (
    select 1 from channels where channels.id = dramas.channel_id and channels.owner_id = auth.uid()
  ))
));
create policy "Channel owners can manage episodes" on episodes for insert with check (exists (
  select 1 from dramas join channels on channels.id = dramas.channel_id
  where dramas.id = episodes.drama_id and channels.owner_id = auth.uid()
));

-- Watch progress
create table if not exists watch_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  episode_id uuid references episodes(id) on delete cascade not null,
  progress_sec int default 0,
  completed boolean default false,
  updated_at timestamptz default now(),
  unique(user_id, episode_id)
);

alter table watch_progress enable row level security;
create policy "Users can read own progress" on watch_progress for select using (auth.uid() = user_id);
create policy "Users can upsert own progress" on watch_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on watch_progress for update using (auth.uid() = user_id);

-- Likes
create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  episode_id uuid references episodes(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, episode_id)
);

alter table likes enable row level security;
create policy "Users can read own likes" on likes for select using (auth.uid() = user_id);
create policy "Users can insert own likes" on likes for insert with check (auth.uid() = user_id);
create policy "Users can delete own likes" on likes for delete using (auth.uid() = user_id);

-- AI Generations
create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  premise text not null,
  result jsonb not null,
  model text not null,
  created_at timestamptz default now()
);

alter table generations enable row level security;
create policy "Users can read own generations" on generations for select using (auth.uid() = user_id);
create policy "Users can insert own generations" on generations for insert with check (auth.uid() = user_id);

-- Earnings
create table if not exists earnings (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid references channels(id) on delete cascade not null,
  episode_id uuid references episodes(id) on delete cascade not null,
  amount_cents int not null,
  platform_fee_cents int not null,
  stripe_payment_id text not null,
  created_at timestamptz default now()
);

alter table earnings enable row level security;
create policy "Channel owners can read own earnings" on earnings for select using (exists (
  select 1 from channels where channels.id = earnings.channel_id and channels.owner_id = auth.uid()
));

-- Media storage bucket
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict do nothing;

create policy "Anyone can read media" on storage.objects for select using (bucket_id = 'media');
create policy "Authenticated users can upload media" on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');
