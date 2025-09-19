-- Minimal seed (no secrets)
insert into public.users (id, role) values
  ('00000000-0000-0000-0000-000000000001','user') on conflict (id) do nothing,
  ('00000000-0000-0000-0000-000000000002','admin') on conflict (id) do nothing;

insert into public.posts (id, author_id, title, body, tags)
values
  (gen_random_uuid(),'00000000-0000-0000-0000-000000000001','Welcome to IdeaBoard','Share your first idea!',['intro'])
on conflict (id) do nothing;

