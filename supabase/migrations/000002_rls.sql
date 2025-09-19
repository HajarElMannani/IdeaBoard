-- Enable RLS and policies

create or replace function public.is_admin(u uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.users where id = u and role in ('admin','mod')
  );
$$;

alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;
alter table public.reports enable row level security;
alter table public.users enable row level security;

-- users: allow upsert own row via backend after auth
create policy users_self_select on public.users for select using (true);
create policy users_self_upsert on public.users for insert with check (id = auth.uid());
create policy users_self_update on public.users for update using (id = auth.uid()) with check (id = auth.uid());

-- posts
create policy posts_read_published on public.posts for select using (
  status = 'published' or author_id = auth.uid() or public.is_admin(auth.uid())
);
create policy posts_insert_self on public.posts for insert with check (author_id = auth.uid());
create policy posts_update_owner_or_admin on public.posts for update using (
  author_id = auth.uid() or public.is_admin(auth.uid())
) with check (author_id = auth.uid() or public.is_admin(auth.uid()));

-- comments
create policy comments_read_published on public.comments for select using (
  status = 'published' or author_id = auth.uid() or public.is_admin(auth.uid())
);
create policy comments_insert_self on public.comments for insert with check (author_id = auth.uid());
create policy comments_update_owner_or_admin on public.comments for update using (
  author_id = auth.uid() or public.is_admin(auth.uid())
) with check (author_id = auth.uid() or public.is_admin(auth.uid()));

-- votes
create policy votes_crud_self on public.votes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reports
create policy reports_insert_auth on public.reports for insert with check (reporter_id = auth.uid());
create policy reports_read_admin on public.reports for select using (public.is_admin(auth.uid()));


