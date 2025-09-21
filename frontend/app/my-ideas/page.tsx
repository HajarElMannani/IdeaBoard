"use client";
import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/hooks/useSession";
import { supabase } from "@/lib/supabaseClient";
import VoteButton from "@/components/VoteButton";

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

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) { setPosts([]); setCommentsCount({}); setLoadingList(false); return; }
      setLoadingList(true);
      setError(null);
      const { data, error } = await supabase
        .from("posts")
        .select("id,title,created_at,up_count,down_count")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });
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
          setCommentsCount(Object.fromEntries(countsEntries));
        }
      }
      setLoadingList(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <section className="space-y-6 md:space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">My ideas</h1>
        <p className="mt-1 text-sm text-gray-600">Your ideas with votes and comments.</p>
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
                        <div className="mt-1 text-xs text-gray-600 flex items-center gap-3">
                          <span>👍 {p.up_count}</span>
                          <span>👎 {p.down_count}</span>
                          <button
                            type="button"
                            className="underline"
                            onClick={async () => {
                              setCommentsError(null);
                              if (openCommentsFor === p.id) { setOpenCommentsFor(null); return; }
                              setOpenCommentsFor(p.id);
                              if (!commentsByPost[p.id]) {
                                setCommentsLoading(p.id);
                                const { data, error } = await supabase
                                  .from("comments")
                                  .select("id, body, created_at, up_count, down_count, author_id, users:users!comments_author_id_fkey(username)")
                                  .eq("post_id", p.id)
                                  .eq("status", "published")
                                  .order("created_at", { ascending: false })
                                  .limit(10);
                                if (error) setCommentsError(error.message);
                                else setCommentsByPost((m) => ({ ...m, [p.id]: (data ?? []) as any }));
                                setCommentsLoading(null);
                              }
                            }}
                          >
                            💬 {commentsCount[p.id] ?? 0}
                          </button>
                        </div>
                        {openCommentsFor === p.id && (
                          <div className="mt-2">
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


