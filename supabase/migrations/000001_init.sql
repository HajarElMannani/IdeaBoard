-- Schema: core tables
create extension if not exists pgcrypto;

-- Users (mirrors auth.users via id)
create table if not exists public.users (
  id uuid primary key,
  role text not null default 'user' check (role in ('user','mod','admin')),
  created_at timestamptz not null default now()
);

-- Posts
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  tags text[] default '{}',
  status text not null default 'published' check (status in ('published','hidden','deleted')),
  up_count integer not null default 0,
  down_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  status text not null default 'published' check (status in ('published','hidden','deleted')),
  up_count integer not null default 0,
  down_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Votes (unique per user+target)
create table if not exists public.votes (
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  value integer not null check (value in (-1,1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_target check ((post_id is not null) <> (comment_id is not null)),
  constraint votes_pk primary key (user_id, post_id, comment_id)
);

-- Reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint one_target check ((post_id is not null) <> (comment_id is not null))
);


