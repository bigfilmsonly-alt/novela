-- ============================================================================
-- NOVELA Platform Schema
-- Vertical micro-drama platform with coin economy
-- Migration 001: Full platform schema, RLS policies, indexes, seed data
-- ============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. PROFILES
-- ============================================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  display_name text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

comment on table public.profiles is 'User profiles linked 1:1 with auth.users';

-- ============================================================================
-- 2. WALLETS
-- ============================================================================
create table public.wallets (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null unique references public.profiles(id) on delete cascade,
  coin_balance            int not null default 0 check (coin_balance >= 0),
  lifetime_coins_purchased int not null default 0,
  updated_at              timestamptz not null default now()
);

comment on table public.wallets is 'Coin wallet per user; balance must never go negative';

-- ============================================================================
-- 3. CHANNELS (creator storefronts)
-- ============================================================================
create table public.channels (
  id                uuid primary key default uuid_generate_v4(),
  owner_id          uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  slug              text unique not null,
  description       text,
  avatar_url        text,
  banner_url        text,
  stripe_account_id text,
  subscriber_count  int not null default 0,
  is_verified       boolean not null default false,
  created_at        timestamptz not null default now()
);

comment on table public.channels is 'Creator channels that publish series';

-- ============================================================================
-- 4. SERIES (vertical micro-dramas)
-- ============================================================================
create type public.series_status as enum ('draft', 'published', 'archived');

create table public.series (
  id              uuid primary key default uuid_generate_v4(),
  channel_id      uuid not null references public.channels(id) on delete cascade,
  title           text not null,
  logline         text,
  genre           text,
  poster_url      text,
  poster_gradient text,
  total_episodes  int not null default 0,
  status          public.series_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.series is 'A drama series containing multiple episodes';

-- ============================================================================
-- 5. EPISODES
-- ============================================================================
create table public.episodes (
  id              uuid primary key default uuid_generate_v4(),
  series_id       uuid not null references public.series(id) on delete cascade,
  episode_number  int not null,
  title           text not null,
  synopsis        text,
  video_url       text,
  video_id        text,
  poster_url      text,
  duration_sec    int,
  is_free         boolean not null default false,
  coin_price      int not null default 30,
  view_count      int not null default 0,
  like_count      int not null default 0,
  created_at      timestamptz not null default now(),

  unique (series_id, episode_number)
);

comment on table public.episodes is 'Individual episodes; ep 1-2 typically free, rest cost coins';
comment on column public.episodes.video_id is 'External video ID for Cloudflare Stream or Mux';
comment on column public.episodes.coin_price is 'Cost in coins to unlock (0 if free)';

-- ============================================================================
-- 6. ENTITLEMENTS (unlocked episodes)
-- ============================================================================
create type public.entitlement_source as enum ('free', 'coin', 'pass', 'vip');

create table public.entitlements (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  episode_id  uuid not null references public.episodes(id) on delete cascade,
  source      public.entitlement_source not null,
  created_at  timestamptz not null default now(),

  unique (user_id, episode_id)
);

comment on table public.entitlements is 'Tracks which episodes a user has access to and how they got it';

-- ============================================================================
-- 7. COIN LEDGER (immutable transaction log)
-- ============================================================================
create type public.ledger_source as enum ('purchase', 'unlock', 'daily_vip', 'refund', 'promo');

create table public.coin_ledger (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  amount        int not null,
  balance_after int not null,
  source        public.ledger_source not null,
  reference_id  uuid,
  description   text,
  created_at    timestamptz not null default now()
);

comment on table public.coin_ledger is 'Immutable ledger of all coin transactions; amount positive=credit, negative=debit';

-- ============================================================================
-- 8. COIN PACKS (purchasable bundles)
-- ============================================================================
create table public.coin_packs (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  coins           int not null,
  price_cents     int not null,
  bonus_coins     int not null default 0,
  stripe_price_id text,
  is_popular      boolean not null default false,
  sort_order      int not null default 0
);

comment on table public.coin_packs is 'Purchasable coin bundles shown in the store';

-- ============================================================================
-- 9. SEASON PASSES
-- ============================================================================
create table public.season_passes (
  id              uuid primary key default uuid_generate_v4(),
  series_id       uuid not null references public.series(id) on delete cascade,
  price_cents     int not null,
  stripe_price_id text,
  created_at      timestamptz not null default now()
);

comment on table public.season_passes is 'One-time purchase to unlock all episodes in a series';

-- ============================================================================
-- 10. SUBSCRIPTIONS (VIP)
-- ============================================================================
create type public.subscription_status as enum ('active', 'cancelled', 'past_due');

create table public.subscriptions (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  stripe_subscription_id  text unique,
  status                  public.subscription_status not null default 'active',
  current_period_end      timestamptz,
  created_at              timestamptz not null default now()
);

comment on table public.subscriptions is 'VIP subscriptions granting daily coins and full catalog access';

-- ============================================================================
-- 11. WATCH PROGRESS
-- ============================================================================
create table public.watch_progress (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  episode_id    uuid not null references public.episodes(id) on delete cascade,
  progress_sec  int not null default 0,
  completed     boolean not null default false,
  updated_at    timestamptz not null default now(),

  unique (user_id, episode_id)
);

comment on table public.watch_progress is 'Per-user viewing progress for resume playback';

-- ============================================================================
-- 12. LIKES
-- ============================================================================
create table public.likes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  episode_id  uuid not null references public.episodes(id) on delete cascade,
  created_at  timestamptz not null default now(),

  unique (user_id, episode_id)
);

comment on table public.likes is 'User likes on episodes';

-- ============================================================================
-- 13. COMMENTS
-- ============================================================================
create table public.comments (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  episode_id  uuid not null references public.episodes(id) on delete cascade,
  parent_id   uuid references public.comments(id) on delete cascade,
  content     text not null check (char_length(content) > 0 and char_length(content) <= 2000),
  like_count  int not null default 0,
  created_at  timestamptz not null default now()
);

comment on table public.comments is 'Episode comments with optional threading via parent_id';

-- ============================================================================
-- 14. CHANNEL SUBSCRIPTIONS (follow a channel)
-- ============================================================================
create table public.channel_subscriptions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  channel_id  uuid not null references public.channels(id) on delete cascade,
  created_at  timestamptz not null default now(),

  unique (user_id, channel_id)
);

comment on table public.channel_subscriptions is 'Users following/subscribing to a creator channel';

-- ============================================================================
-- 15. CREATOR PAYOUTS
-- ============================================================================
create table public.creator_payouts (
  id                uuid primary key default uuid_generate_v4(),
  channel_id        uuid not null references public.channels(id) on delete cascade,
  amount_cents      int not null,
  platform_fee_cents int not null,
  stripe_payout_id  text,
  status            text not null default 'pending',
  period_start      timestamptz not null,
  period_end        timestamptz not null,
  created_at        timestamptz not null default now()
);

comment on table public.creator_payouts is 'Revenue payouts to creators via Stripe Connect';

-- ============================================================================
-- 16. MODERATION QUEUE
-- ============================================================================
create type public.moderation_status as enum ('pending', 'approved', 'rejected');

create table public.moderation_queue (
  id              uuid primary key default uuid_generate_v4(),
  episode_id      uuid not null references public.episodes(id) on delete cascade,
  status          public.moderation_status not null default 'pending',
  reviewer_id     uuid references public.profiles(id) on delete set null,
  notes           text,
  automated_flags jsonb default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz
);

comment on table public.moderation_queue is 'Content moderation pipeline for uploaded episodes';

-- ============================================================================
-- 17. GENERATIONS (AI script generation)
-- ============================================================================
create table public.generations (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  premise     text not null,
  result      jsonb,
  model       text,
  created_at  timestamptz not null default now()
);

comment on table public.generations is 'AI-generated script outputs from the story engine';


-- ============================================================================
-- INDEXES
-- ============================================================================

-- profiles
create index idx_profiles_email on public.profiles(email);

-- wallets
create index idx_wallets_user_id on public.wallets(user_id);

-- channels
create index idx_channels_owner_id on public.channels(owner_id);
create index idx_channels_slug on public.channels(slug);

-- series
create index idx_series_channel_id on public.series(channel_id);
create index idx_series_status on public.series(status);
create index idx_series_genre on public.series(genre);

-- episodes
create index idx_episodes_series_id on public.episodes(series_id);
create index idx_episodes_view_count on public.episodes(view_count desc);

-- entitlements
create index idx_entitlements_user_id on public.entitlements(user_id);
create index idx_entitlements_episode_id on public.entitlements(episode_id);

-- coin_ledger
create index idx_coin_ledger_user_id on public.coin_ledger(user_id);
create index idx_coin_ledger_created_at on public.coin_ledger(created_at desc);
create index idx_coin_ledger_source on public.coin_ledger(source);

-- season_passes
create index idx_season_passes_series_id on public.season_passes(series_id);

-- subscriptions
create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_status on public.subscriptions(status);

-- watch_progress
create index idx_watch_progress_user_id on public.watch_progress(user_id);
create index idx_watch_progress_episode_id on public.watch_progress(episode_id);

-- likes
create index idx_likes_user_id on public.likes(user_id);
create index idx_likes_episode_id on public.likes(episode_id);

-- comments
create index idx_comments_episode_id on public.comments(episode_id);
create index idx_comments_user_id on public.comments(user_id);
create index idx_comments_parent_id on public.comments(parent_id);

-- channel_subscriptions
create index idx_channel_subs_user_id on public.channel_subscriptions(user_id);
create index idx_channel_subs_channel_id on public.channel_subscriptions(channel_id);

-- creator_payouts
create index idx_creator_payouts_channel_id on public.creator_payouts(channel_id);
create index idx_creator_payouts_status on public.creator_payouts(status);

-- moderation_queue
create index idx_moderation_episode_id on public.moderation_queue(episode_id);
create index idx_moderation_status on public.moderation_queue(status);

-- generations
create index idx_generations_user_id on public.generations(user_id);


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.channels enable row level security;
alter table public.series enable row level security;
alter table public.episodes enable row level security;
alter table public.entitlements enable row level security;
alter table public.coin_ledger enable row level security;
alter table public.coin_packs enable row level security;
alter table public.season_passes enable row level security;
alter table public.subscriptions enable row level security;
alter table public.watch_progress enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.channel_subscriptions enable row level security;
alter table public.creator_payouts enable row level security;
alter table public.moderation_queue enable row level security;
alter table public.generations enable row level security;

-- ---------------------------------------------------------------------------
-- PROFILES policies
-- ---------------------------------------------------------------------------
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- WALLETS policies
-- ---------------------------------------------------------------------------
create policy "Users can view their own wallet"
  on public.wallets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own wallet"
  on public.wallets for insert
  with check (auth.uid() = user_id);

-- Wallet updates (balance changes) happen via server-side functions with service role,
-- so no direct update policy for end users.

-- ---------------------------------------------------------------------------
-- CHANNELS policies
-- ---------------------------------------------------------------------------
create policy "Channels are publicly readable"
  on public.channels for select
  using (true);

create policy "Channel owners can insert their channel"
  on public.channels for insert
  with check (auth.uid() = owner_id);

create policy "Channel owners can update their channel"
  on public.channels for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- ---------------------------------------------------------------------------
-- SERIES policies
-- ---------------------------------------------------------------------------
create policy "Published series are publicly readable"
  on public.series for select
  using (status = 'published' or channel_id in (
    select id from public.channels where owner_id = auth.uid()
  ));

create policy "Channel owners can insert series"
  on public.series for insert
  with check (channel_id in (
    select id from public.channels where owner_id = auth.uid()
  ));

create policy "Channel owners can update their series"
  on public.series for update
  using (channel_id in (
    select id from public.channels where owner_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- EPISODES policies
-- ---------------------------------------------------------------------------
create policy "Episodes of published series are publicly readable"
  on public.episodes for select
  using (series_id in (
    select id from public.series where status = 'published'
  ) or series_id in (
    select s.id from public.series s
    join public.channels c on c.id = s.channel_id
    where c.owner_id = auth.uid()
  ));

create policy "Channel owners can insert episodes"
  on public.episodes for insert
  with check (series_id in (
    select s.id from public.series s
    join public.channels c on c.id = s.channel_id
    where c.owner_id = auth.uid()
  ));

create policy "Channel owners can update their episodes"
  on public.episodes for update
  using (series_id in (
    select s.id from public.series s
    join public.channels c on c.id = s.channel_id
    where c.owner_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- ENTITLEMENTS policies
-- ---------------------------------------------------------------------------
create policy "Users can view their own entitlements"
  on public.entitlements for select
  using (auth.uid() = user_id);

-- Inserts happen via the unlock_episode function (service role)

-- ---------------------------------------------------------------------------
-- COIN LEDGER policies
-- ---------------------------------------------------------------------------
create policy "Users can view their own ledger"
  on public.coin_ledger for select
  using (auth.uid() = user_id);

-- Inserts happen via server-side functions only

-- ---------------------------------------------------------------------------
-- COIN PACKS policies
-- ---------------------------------------------------------------------------
create policy "Coin packs are publicly readable"
  on public.coin_packs for select
  using (true);

-- Only admins manage coin packs (via service role)

-- ---------------------------------------------------------------------------
-- SEASON PASSES policies
-- ---------------------------------------------------------------------------
create policy "Season passes are publicly readable"
  on public.season_passes for select
  using (true);

-- ---------------------------------------------------------------------------
-- SUBSCRIPTIONS policies
-- ---------------------------------------------------------------------------
create policy "Users can view their own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Managed via Stripe webhooks (service role)

-- ---------------------------------------------------------------------------
-- WATCH PROGRESS policies
-- ---------------------------------------------------------------------------
create policy "Users can view their own watch progress"
  on public.watch_progress for select
  using (auth.uid() = user_id);

create policy "Users can upsert their own watch progress"
  on public.watch_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own watch progress"
  on public.watch_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- LIKES policies
-- ---------------------------------------------------------------------------
create policy "Likes are publicly readable"
  on public.likes for select
  using (true);

create policy "Users can insert their own likes"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own likes"
  on public.likes for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- COMMENTS policies
-- ---------------------------------------------------------------------------
create policy "Comments are publicly readable"
  on public.comments for select
  using (true);

create policy "Authenticated users can insert comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own comments"
  on public.comments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- CHANNEL SUBSCRIPTIONS policies
-- ---------------------------------------------------------------------------
create policy "Channel subscriptions are publicly readable"
  on public.channel_subscriptions for select
  using (true);

create policy "Users can subscribe to channels"
  on public.channel_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can unsubscribe from channels"
  on public.channel_subscriptions for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- CREATOR PAYOUTS policies
-- ---------------------------------------------------------------------------
create policy "Channel owners can view their payouts"
  on public.creator_payouts for select
  using (channel_id in (
    select id from public.channels where owner_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- MODERATION QUEUE policies
-- ---------------------------------------------------------------------------
-- Moderation is admin-only; creators can see their own items
create policy "Creators can view moderation status of their episodes"
  on public.moderation_queue for select
  using (episode_id in (
    select e.id from public.episodes e
    join public.series s on s.id = e.series_id
    join public.channels c on c.id = s.channel_id
    where c.owner_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- GENERATIONS policies
-- ---------------------------------------------------------------------------
create policy "Users can view their own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own generations"
  on public.generations for insert
  with check (auth.uid() = user_id);


-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Auto-create profile + wallet on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );

  insert into public.wallets (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Updated-at trigger (reusable)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_wallets_updated_at
  before update on public.wallets
  for each row execute function public.set_updated_at();

create trigger set_series_updated_at
  before update on public.series
  for each row execute function public.set_updated_at();

create trigger set_watch_progress_updated_at
  before update on public.watch_progress
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Unlock episode: debit coins + grant entitlement atomically
-- ---------------------------------------------------------------------------
create or replace function public.unlock_episode(
  p_user_id   uuid,
  p_episode_id uuid
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_coin_price   int;
  v_is_free      boolean;
  v_balance      int;
  v_new_balance  int;
  v_entitlement_id uuid;
begin
  -- 1. Check if user already has access
  if exists (
    select 1 from public.entitlements
    where user_id = p_user_id and episode_id = p_episode_id
  ) then
    return jsonb_build_object(
      'success', false,
      'error', 'already_unlocked',
      'message', 'You already have access to this episode'
    );
  end if;

  -- 2. Get episode pricing
  select coin_price, is_free into v_coin_price, v_is_free
  from public.episodes
  where id = p_episode_id;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'episode_not_found',
      'message', 'Episode does not exist'
    );
  end if;

  -- 3. If free, grant entitlement immediately
  if v_is_free or v_coin_price = 0 then
    insert into public.entitlements (user_id, episode_id, source)
    values (p_user_id, p_episode_id, 'free')
    returning id into v_entitlement_id;

    return jsonb_build_object(
      'success', true,
      'entitlement_id', v_entitlement_id,
      'source', 'free',
      'coins_spent', 0
    );
  end if;

  -- 4. Lock the wallet row and check balance
  select coin_balance into v_balance
  from public.wallets
  where user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'wallet_not_found',
      'message', 'Wallet does not exist for this user'
    );
  end if;

  if v_balance < v_coin_price then
    return jsonb_build_object(
      'success', false,
      'error', 'insufficient_coins',
      'message', 'Not enough coins',
      'required', v_coin_price,
      'balance', v_balance
    );
  end if;

  -- 5. Debit coins
  v_new_balance := v_balance - v_coin_price;

  update public.wallets
  set coin_balance = v_new_balance
  where user_id = p_user_id;

  -- 6. Create entitlement
  insert into public.entitlements (user_id, episode_id, source)
  values (p_user_id, p_episode_id, 'coin')
  returning id into v_entitlement_id;

  -- 7. Log to ledger
  insert into public.coin_ledger (user_id, amount, balance_after, source, reference_id, description)
  values (
    p_user_id,
    -v_coin_price,
    v_new_balance,
    'unlock',
    v_entitlement_id,
    'Unlocked episode'
  );

  return jsonb_build_object(
    'success', true,
    'entitlement_id', v_entitlement_id,
    'source', 'coin',
    'coins_spent', v_coin_price,
    'new_balance', v_new_balance
  );
end;
$$;

comment on function public.unlock_episode is 'Atomically debits coins from wallet and grants episode entitlement. Returns JSON with success status.';

-- ---------------------------------------------------------------------------
-- Credit coins (called after Stripe purchase confirmation)
-- ---------------------------------------------------------------------------
create or replace function public.credit_coins(
  p_user_id    uuid,
  p_amount     int,
  p_source     public.ledger_source,
  p_reference  uuid default null,
  p_description text default null
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_new_balance int;
begin
  if p_amount <= 0 then
    return jsonb_build_object(
      'success', false,
      'error', 'invalid_amount',
      'message', 'Credit amount must be positive'
    );
  end if;

  update public.wallets
  set coin_balance = coin_balance + p_amount,
      lifetime_coins_purchased = case
        when p_source = 'purchase' then lifetime_coins_purchased + p_amount
        else lifetime_coins_purchased
      end
  where user_id = p_user_id
  returning coin_balance into v_new_balance;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'wallet_not_found',
      'message', 'Wallet does not exist for this user'
    );
  end if;

  insert into public.coin_ledger (user_id, amount, balance_after, source, reference_id, description)
  values (p_user_id, p_amount, v_new_balance, p_source, p_reference, p_description);

  return jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'credited', p_amount
  );
end;
$$;

comment on function public.credit_coins is 'Credits coins to a user wallet and logs to ledger. Used after purchase confirmation.';

-- ---------------------------------------------------------------------------
-- Increment view count (called on playback start)
-- ---------------------------------------------------------------------------
create or replace function public.increment_view_count(p_episode_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.episodes
  set view_count = view_count + 1
  where id = p_episode_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Toggle like (insert or delete, update denormalized count)
-- ---------------------------------------------------------------------------
create or replace function public.toggle_like(
  p_user_id    uuid,
  p_episode_id uuid
)
returns jsonb
language plpgsql
security definer set search_path = ''
as $$
declare
  v_existed boolean;
begin
  -- Try to delete first
  delete from public.likes
  where user_id = p_user_id and episode_id = p_episode_id;

  if found then
    update public.episodes
    set like_count = greatest(like_count - 1, 0)
    where id = p_episode_id;

    return jsonb_build_object('liked', false);
  else
    insert into public.likes (user_id, episode_id)
    values (p_user_id, p_episode_id);

    update public.episodes
    set like_count = like_count + 1
    where id = p_episode_id;

    return jsonb_build_object('liked', true);
  end if;
end;
$$;


-- ============================================================================
-- SEED DATA: Coin Packs
-- ============================================================================
insert into public.coin_packs (name, coins, price_cents, bonus_coins, is_popular, sort_order) values
  ('Starter',    100,  199,    0, false, 1),
  ('Popular',    500,  799,   50, true,  2),
  ('Best Value', 1200, 1499, 200, false, 3),
  ('Mega Pack',  3000, 2999, 500, false, 4);
