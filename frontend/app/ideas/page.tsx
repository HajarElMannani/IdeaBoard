"use client";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import * as React from "react";
import { usePosts } from "@/lib/hooks/usePosts";
import { useSession } from "@/lib/hooks/useSession";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { addComment } from "@/lib/hooks/useComments";
import { supabase } from "@/lib/supabaseClient";
import { ensureUserRow } from "@/lib/user";
import VoteButton from "@/components/VoteButton";
import { formatDateTimeNoSeconds } from "@/lib/format";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter, useSearchParams } from "next/navigation";

export default function IdeasPage() {
  const [tab, setTab] = React.useState<"new" | "top">("new");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState("");

  // Initialize filters from URL on first render
  React.useEffect(() => {
    const q = searchParams.get("q") || "";
    const t = searchParams.get("tag") || "";
    setSearch(q);
    setTagFilter(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist filters to URL (without full reload)
  React.useEffect(() => {
    const currentQ = searchParams.get("q") || "";
    const currentTag = searchParams.get("tag") || "";
    if (currentQ === search && currentTag === tagFilter) return;
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("q", search); else params.delete("q");
    if (tagFilter) params.set("tag", tagFilter); else params.delete("tag");
    const qs = params.toString();
    router.replace(`/ideas${qs ? `?${qs}` : ""}`);
  }, [search, tagFilter, router, searchParams]);
  const { data, loading, error } = usePosts(tab, 1, 10, { search, tag: tagFilter || undefined });
  const { user } = useSession();
  const [postingFor, setPostingFor] = React.useState<string | null>(null);
  const [postError, setPostError] = React.useState<string | null>(null);
  const [votingFor, setVotingFor] = React.useState<string | null>(null);
  const [voteError, setVoteError] = React.useState<string | null>(null);
  const [countsOverride, setCountsOverride] = React.useState<Record<string, { up_count: number; down_count: number }>>({});
  const [commentPreview, setCommentPreview] = React.useState<Record<string, { id: string; body: string; up_count: number; down_count: number; created_at: string; username: string | null }>>({});
  const [commentPreviewLoading, setCommentPreviewLoading] = React.useState(false);
  const [userVotes, setUserVotes] = React.useState<Record<string, 0 | 1 | -1>>({});
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [commentsCount, setCommentsCount] = React.useState<Record<string, number>>({});

  // Load 1 most recent comment per post (preview)
  React.useEffect(() => {
    let cancelled = false;
    async function loadPreviews() {
      if (!data || data.length === 0) { setCommentPreview({}); return; }
      setCommentPreviewLoading(true);
      const ids = data.map((p) => p.id);
      const { data: comments, error } = await supabase
        .from("comments")
        .select("id, post_id, body, created_at, up_count, down_count, users:users!comments_author_id_fkey(username)")
        .in("post_id", ids)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (!error && comments) {
        const firstByPost: Record<string, { id: string; body: string; up_count: number; down_count: number; created_at: string; username: string | null }> = {};
        for (const c of comments) {
          const pid = (c as any).post_id as string;
          if (!firstByPost[pid]) firstByPost[pid] = {
            id: (c as any).id as string,
            body: (c as any).body as string,
            up_count: (c as any).up_count as number,
            down_count: (c as any).down_count as number,
            created_at: (c as any).created_at as string,
            username: ((c as any).users?.username ?? null) as string | null,
          };
        }
        setCommentPreview(firstByPost);
      } else {
        setCommentPreview({});
      }
      setCommentPreviewLoading(false);
    }
    loadPreviews();
    return () => { cancelled = true; };
  }, [data]);

  // Load current user's existing votes for posts in the feed (for selected state)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !data || data.length === 0) { setUserVotes({}); return; }
      const ids = data.map((p) => p.id);
      const { data: rows, error } = await supabase
        .from("votes")
        .select("post_id,value")
        .in("post_id", ids)
        .eq("user_id", user.id);
      if (cancelled) return;
      if (!error && rows) {
        const map: Record<string, 0 | 1 | -1> = {};
        for (const r of rows) map[(r as any).post_id as string] = ((r as any).value as 1 | -1);
        setUserVotes(map);
      }
    })();
    return () => { cancelled = true; };
  }, [user, data]);

  // Realtime: update preview, counts, and user vote selection when comments/votes change
  React.useEffect(() => {
    const postsChannel = supabase
      .channel("ideas-page-posts")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        async (payload: any) => {
          const row = payload.new as any;
          if (!row?.id) return;
          // Refresh counts override for the updated post
          const { data } = await supabase.from("posts").select("up_count,down_count").eq("id", row.id).maybeSingle();
          if (data) setCountsOverride((m) => ({ ...m, [row.id]: data as any }));
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel("ideas-page-comments")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload: any) => {
          const row = payload.new as any;
          if (!row?.post_id) return;
          // bump comments count for the related post
          setCommentsCount((m) => ({ ...m, [row.post_id]: (m[row.post_id] ?? 0) + 1 }));
          // if this is the newest, update preview
          setCommentPreview((prev) => {
            const existing = prev[row.post_id];
            if (!existing || (row.created_at > existing.created_at)) {
              return {
                ...prev,
                [row.post_id]: {
                  id: row.id,
                  body: row.body,
                  up_count: row.up_count ?? 0,
                  down_count: row.down_count ?? 0,
                  created_at: row.created_at,
                  username: existing?.username ?? null,
                },
              };
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, []);

  // Load comments count per post in the current page
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!data || data.length === 0) { setCommentsCount({}); return; }
      const entries = await Promise.all(
        data.map(async (p) => {
          const { count } = await supabase
            .from("comments")
            .select("id", { count: "exact", head: true })
            .eq("post_id", p.id)
            .eq("status", "published");
          return [p.id, count ?? 0] as const;
        })
      );
      if (!cancelled) setCommentsCount(Object.fromEntries(entries));
    })();
    return () => { cancelled = true; };
  }, [data]);

  async function vote(postId: string, value: 1 | -1) {
    if (!user) { setLoginOpen(true); return; }
    setVoteError(null);
    setVotingFor(postId);
    await ensureUserRow();
    const { data: auth } = await supabase.auth.getUser();
    const previous = userVotes[postId] ?? 0;
    if (previous === value) {
      // Toggle off: delete vote
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("user_id", auth.user?.id)
        .eq("post_id", postId);
      if (error) setVoteError(error.message);
      else {
        setUserVotes((m) => ({ ...m, [postId]: 0 }));
        const { data } = await supabase.from("posts").select("up_count,down_count").eq("id", postId).maybeSingle();
        if (data) setCountsOverride((m) => ({ ...m, [postId]: data as any }));
      }
    } else {
      // Upsert new/changed vote
      const payload: any = { user_id: auth.user?.id, post_id: postId, value };
      const { error } = await supabase
        .from("votes")
        .upsert(payload, { onConflict: "user_id,post_id" });
      if (error) setVoteError(error.message);
      else {
        setUserVotes((m) => ({ ...m, [postId]: value }));
        const { data } = await supabase.from("posts").select("up_count,down_count").eq("id", postId).maybeSingle();
        if (data) setCountsOverride((m) => ({ ...m, [postId]: data as any }));
      }
    }
    setVotingFor(null);
  }
  return (
    <section className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Ideas</h1>
          <p className="mt-1 text-sm text-gray-600">Browse new and top ideas</p>
        </div>
        <Button
          variant="solid"
          size="sm"
          onClick={() => {
            if (!user) { setLoginOpen(true); return; }
            window.location.href = "/ideas/new";
          }}
        >
          Create new idea
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 -mt-8">
        <div className="flex items-center gap-2 flex-1">
          <input
          type="text"
          placeholder="Search ideas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-72 border rounded-md px-3 py-2 text-sm"
          />
          <input
          type="text"
          placeholder="Filter by tag (press Enter)"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="w-full md:w-56 border rounded-md px-3 py-2 text-sm"
          />
          {tagFilter && (
            <button
              type="button"
              className="text-xs text-gray-600 underline"
              onClick={() => setTagFilter("")}
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center justify-end">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="scale-90 origin-right">
              <TabsTrigger value="new" className="text-xs px-2 py-1">New</TabsTrigger>
              <TabsTrigger value="top" className="text-xs px-2 py-1">Top</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <Card className="app-card">
        {loading && <div className="text-sm text-gray-700">Loading...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && !error && (
          <ul className="space-y-3">
            {data.map((p) => (
              <li key={p.id} className="border-b border-gray-200 pb-3">
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/ideas/${p.id}`} className="font-semibold text-base md:text-lg hover:underline">{p.title}</Link>
                        <span className="text-xs text-gray-600">by {p.users?.username || 'user'}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-700 line-clamp-3">{p.body}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {Array.isArray(p.tags) && p.tags.slice(0, 6).map((tag, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="inline-block rounded-full bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 hover:bg-indigo-200"
                          onClick={() => setTagFilter(String(tag))}
                          title="Filter by tag"
                        >
                          {String(tag)}
                        </button>
                      ))}
                      {Array.isArray(p.tags) && p.tags.length > 6 && (
                        <span className="text-xs text-gray-500">+{p.tags.length - 6} more</span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 whitespace-nowrap">{formatDateTimeNoSeconds(p.created_at)}</div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 flex items-center gap-4">
                    <button
                      type="button"
                      className="hover:underline disabled:opacity-50"
                      onClick={() => vote(p.id, 1)}
                      disabled={votingFor === p.id}
                    >
                      👍 {(countsOverride[p.id]?.up_count ?? p.up_count)}
                    </button>
                    <button
                      type="button"
                      className="hover:underline disabled:opacity-50"
                      onClick={() => vote(p.id, -1)}
                      disabled={votingFor === p.id}
                    >
                      👎 {(countsOverride[p.id]?.down_count ?? p.down_count)}
                    </button>
                    <Link href={`/ideas/${p.id}`} className="hover:underline">💬 {commentsCount[p.id] ?? 0}</Link>
                    {voteError && <span className="text-red-600">{voteError}</span>}
                  </div>
                  {commentPreviewLoading ? (
                    <div className="mt-2 text-xs text-gray-600">Loading comments…</div>
                  ) : commentPreview[p.id] ? (
                    <div className="mt-2 pl-3 pr-2 py-2 border-l-2 border-indigo-200 bg-indigo-50/50 rounded-sm">
                      <div className="text-xs font-medium text-indigo-800">Latest comment</div>
                      <p className="mt-1 text-sm text-gray-800 line-clamp-3 whitespace-pre-wrap">{commentPreview[p.id].body}</p>
                      <div className="text-xs text-gray-700 mt-2 flex items-center gap-3">
                        <VoteButton
                          commentId={commentPreview[p.id].id}
                          upCount={commentPreview[p.id].up_count}
                          downCount={commentPreview[p.id].down_count}
                          onRequireLogin={() => setLoginOpen(true)}
                        />
                        <div>by {commentPreview[p.id].username || 'user'} · {formatDateTimeNoSeconds(commentPreview[p.id].created_at)}</div>
                      </div>
                      <Link href={`/ideas/${p.id}`} className="text-xs underline text-gray-700 mt-1 inline-block">See more</Link>
                    </div>
                  ) : null}
                </div>
                {(
                  <form
                    className="mt-2 space-y-1"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!user) { setLoginOpen(true); return; }
                      setPostError(null);
                      setPostingFor(p.id);
                      const formEl = e.currentTarget as HTMLFormElement;
                      const fd = new FormData(formEl);
                      const body = String(fd.get("body") || "").trim();
                      if (!body) { setPostingFor(null); return; }
                      try {
                        await addComment(p.id, body);
                        formEl.reset();
                      } catch (err: any) {
                        setPostError(err.message || "Failed to comment");
                      } finally {
                        setPostingFor(null);
                      }
                    }}
                  >
                    <Textarea name="body" rows={1} className="text-sm py-1 resize-none" placeholder="Add a comment" />
                    <div className="flex items-center justify-end gap-3">
                      {postError && <span className="text-xs text-red-600">{postError}</span>}
                      <Button variant="solid" size="sm" disabled={postingFor === p.id}>Comment</Button>
                    </div>
                  </form>
                )}
              </li>
            ))}
            {data.length === 0 && <li className="text-sm text-gray-700">No ideas yet.</li>}
          </ul>
        )}
      </Card>

      

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>
              Please log in or register to vote, comment, or create an idea.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" className="text-sm" onClick={() => setLoginOpen(false)}>Cancel</button>
            <Link href="/auth" className="underline text-sm">Go to login</Link>
            <Link href="/auth" className="underline text-sm">Create an account</Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}


