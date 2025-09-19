-- updated_at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_posts_updated on public.posts;
create trigger trg_posts_updated before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists trg_comments_updated on public.comments;
create trigger trg_comments_updated before update on public.comments
for each row execute function public.set_updated_at();

-- vote counters via views or triggers
-- Simple triggers to keep counts in sync on posts
create or replace function public.apply_post_vote()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    if (new.value = 1) then
      update public.posts set up_count = up_count + 1 where id = coalesce(new.post_id, '00000000-0000-0000-0000-000000000000')::uuid;
    else
      update public.posts set down_count = down_count + 1 where id = coalesce(new.post_id, '00000000-0000-0000-0000-000000000000')::uuid;
    end if;
  elsif (tg_op = 'UPDATE') then
    if (new.post_id is not null and old.value <> new.value) then
      if (new.value = 1) then
        update public.posts set up_count = up_count + 1, down_count = down_count - 1 where id = new.post_id;
      else
        update public.posts set up_count = up_count - 1, down_count = down_count + 1 where id = new.post_id;
      end if;
    end if;
  elsif (tg_op = 'DELETE') then
    if (old.value = 1) then
      update public.posts set up_count = up_count - 1 where id = coalesce(old.post_id, '00000000-0000-0000-0000-000000000000')::uuid;
    else
      update public.posts set down_count = down_count - 1 where id = coalesce(old.post_id, '00000000-0000-0000-0000-000000000000')::uuid;
    end if;
  end if;
  return null;
end; $$;

drop trigger if exists trg_votes_posts on public.votes;
create trigger trg_votes_posts after insert or update or delete on public.votes
for each row execute function public.apply_post_vote();


