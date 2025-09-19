-- Useful indexes
create index if not exists idx_posts_created_at on public.posts (created_at desc);
create index if not exists idx_posts_votes on public.posts (up_count desc, down_count asc);
create index if not exists idx_posts_tags_gin on public.posts using gin (tags);
create index if not exists idx_comments_post_id on public.comments (post_id);
create index if not exists idx_votes_post_id on public.votes (post_id);
create index if not exists idx_votes_comment_id on public.votes (comment_id);

