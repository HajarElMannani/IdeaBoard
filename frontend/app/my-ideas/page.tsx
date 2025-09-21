"use client";
import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/hooks/useSession";
import { supabase } from "@/lib/supabaseClient";
import VoteButton from "@/components/VoteButton";
import { formatDateTimeNoSeconds } from "@/lib/format";
import { Button } from "@/components/ui/button";

type MyPost = {
  id: string;
  title: string;
  created_at: string;
  up_count: number;
  down_count: number;
};

export default function MyIdeasPage() {
  const { user, loading } = useSession();
  const [posts, setPosts] = React.useState<MyPost[]>([]);
  const [commentsCount, setCommentsCount] = React.useState<Record<string, number>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [loadingList, setLoadingList] = React.useState(true);
  const [openCommentsFor, setOpenCommentsFor] = React.useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = React.useState<Record<string, Array<{ id: string; body: string; created_at: string; up_count: number; down_count: number; author_id: string; users?: { username?: string | null } | null }>>>({});
  const [commentsLoading, setCommentsLoading] = React.useState<string | null>(null);
  const [commentsError, setCommentsError] = React.useState<string | null>(null);
  const [ideaSort, setIdeaSort] = React.useState<"new" | "top" | "discussed">("new");
  const [commentSortByPost, setCommentSortByPost] = React.useState<Record<string, "new" | "top">>({});

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) { setPosts([]); setCommentsCount({}); setLoadingList(false); return; }
      setLoadingList(true);
      setError(null);
      let query = supabase
        .from("posts")
        .select("id,title,created_at,up_count,down_count")
        .eq("author_id", user.id);
      if (ideaSort === "new") {
        query = query.order("created_at", { ascending: false });
      } else if (ideaSort === "top") {
        query = query
          .order("up_count", { ascending: false })
          .order("down_count", { ascending: true })
          .order("created_at", { ascending: false });
      } else {
        // discussed: we'll sort client-side by comment counts after fetching
        query = query.order("created_at", { ascending: false });
      }
      const { data, error } = await query;
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setPosts([]);
        setCommentsCount({});
      } else {
        const list = (data ?? []) as MyPost[];
        setPosts(list);
        // fetch comments count per post
        const countsEntries = await Promise.all(
          list.map(async (p) => {
            const { count } = await supabase
              .from("comments")
              .select("id", { count: "exact", head: true })
              .eq("post_id", p.id)
              .eq("status", "published");
            return [p.id, count ?? 0] as const;
          })
        );
        if (!cancelled) {
          const countsMap = Object.fromEntries(countsEntries) as Record<string, number>;
          setCommentsCount(countsMap);
          if (ideaSort === "discussed") {
            const sorted = [...list].sort((a, b) => {
              const cb = countsMap[b.id] ?? 0;
              const ca = countsMap[a.id] ?? 0;
              if (cb !== ca) return cb - ca;
              // tie-breaker: up votes, then recent
              if (b.up_count !== a.up_count) return b.up_count - a.up_count;
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            setPosts(sorted);
          }
        }
      }
      setLoadingList(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user, ideaSort]);

  async function fetchComments(postId: string, sort?: "new" | "top") {
    const chosen = sort ?? commentSortByPost[postId] ?? "new";
    setCommentsLoading(postId);
    const base = supabase
      .from("comments")
      .select("id, body, created_at, up_count, down_count, author_id, users:users!comments_author_id_fkey(username)")
      .eq("post_id", postId)
      .eq("status", "published");
    const query = chosen === "new"
      ? base.order("created_at", { ascending: false })
      : base.order("up_count", { ascending: false }).order("down_count", { ascending: true }).order("created_at", { ascending: false });
    const { data, error } = await query.limit(10);
    if (error) setCommentsError(error.message);
    else setCommentsByPost((m) => ({ ...m, [postId]: (data ?? []) as any }));
    setCommentsLoading(null);
  }

  return (
    <section className="space-y-6 md:space-y-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">My ideas</h1>
          <p className="mt-1 text-sm text-gray-600">Your ideas with votes and comments.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <label htmlFor="idea-sort" className="mr-1">Sort:</label>
            <select
              id="idea-sort"
              className="border rounded px-2 py-1"
              value={ideaSort}
              onChange={(e) => setIdeaSort(e.target.value as any)}
            >
              <option value="new">Newest</option>
              <option value="top">Most voted</option>
              <option value="discussed">Most discussed</option>
            </select>
          </div>
          {user && (
            <Link href="/ideas/new">
              <Button variant="solid" size="sm">Create new idea</Button>
            </Link>
          )}
        </div>
      </div>

      <Card className="app-card">
        {loading && <div className="text-sm text-gray-700">Loading session…</div>}
        {!loading && !user && <div className="text-sm text-red-600">You must log in to view your ideas.</div>}
        {!loading && user && (
          <>
            {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
            {loadingList && <div className="text-sm text-gray-700">Loading ideas…</div>}
            {!loadingList && (
              <ul className="space-y-3">
                {posts.map((p) => (
                  <li key={p.id} className="border-b border-gray-200 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/ideas/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                        <div className="text-xs text-gray-600">by you · {formatDateTimeNoSeconds(p.created_at)}</div>
                        <div className="mt-1 text-xs text-gray-600 flex items-center gap-3">
                          <VoteButton postId={p.id} upCount={p.up_count} downCount={p.down_count} variant="thumbs" />
                          <button
                            type="button"
                            className="underline"
                            onClick={async () => {
                              setCommentsError(null);
                              if (openCommentsFor === p.id) { setOpenCommentsFor(null); return; }
                              setOpenCommentsFor(p.id);
                              await fetchComments(p.id);
                            }}
                          >
                            💬 {commentsCount[p.id] ?? 0}
                          </button>
                        </div>
                        {openCommentsFor === p.id && (
                          <div className="mt-2 pl-3 pr-2 py-2 border-l-2 border-indigo-200 bg-indigo-50/50 rounded-sm">
                            <div className="flex w-full items-center justify-end gap-2 mb-2 text-xs text-right">
                              <label htmlFor={`comment-sort-${p.id}`}>Sort comments:</label>
                              <select
                                id={`comment-sort-${p.id}`}
                                className="border rounded px-1 py-0.5"
                                value={commentSortByPost[p.id] ?? "new"}
                                onChange={async (e) => {
                                  const v = (e.target.value as "new" | "top");
                                  setCommentSortByPost((m) => ({ ...m, [p.id]: v }));
                                  await fetchComments(p.id, v);
                                }}
                              >
                                <option value="new">Newest</option>
                                <option value="top">Top</option>
                              </select>
                            </div>
                            {commentsLoading === p.id && <div className="text-xs text-gray-600">Loading comments…</div>}
                            {commentsError && <div className="text-xs text-red-600">{commentsError}</div>}
                            {!commentsLoading && !commentsError && (
                              <ul className="space-y-2">
                                {(commentsByPost[p.id] ?? []).slice(0, 5).map((c) => (
                                  <li key={c.id} className="text-sm whitespace-pre-wrap border-l pl-2">
                                    <div className="text-gray-800">{c.body}</div>
                                    <div className="text-xs text-gray-600 mt-2 flex items-center gap-3">
                                      <VoteButton commentId={c.id} upCount={c.up_count} downCount={c.down_count} />
                                      <div>by {c.users?.username || (c.author_id === user?.id ? "you" : "user")} · {new Date(c.created_at).toLocaleString()}</div>
                                    </div>
                                  </li>
                                ))}
                                {(commentsByPost[p.id]?.length ?? 0) === 0 && (
                                  <li className="text-sm text-gray-700">No comments yet.</li>
                                )}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center gap-3 text-xs">
                        <Link href={`/ideas/${p.id}/edit`} className="underline">Edit</Link>
                        <button
                          type="button"
                          className="text-red-600 underline"
                          onClick={async () => {
                            if (!confirm("Delete this idea?")) return;
                            const { error } = await supabase.from("posts").delete().eq("id", p.id);
                            if (error) alert(error.message);
                            else setPosts((arr) => arr.filter((x) => x.id !== p.id));
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
                {posts.length === 0 && <li className="text-sm text-gray-700">You haven't created any ideas yet.</li>}
              </ul>
            )}
          </>
        )}
      </Card>
    </section>
  );
}


