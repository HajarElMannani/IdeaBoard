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

export default function IdeasPage() {
  const [tab, setTab] = React.useState<"new" | "top">("new");
  const { data, loading, error } = usePosts(tab, 1, 10);
  const { user } = useSession();
  const [postingFor, setPostingFor] = React.useState<string | null>(null);
  const [postError, setPostError] = React.useState<string | null>(null);
  const [votingFor, setVotingFor] = React.useState<string | null>(null);
  const [voteError, setVoteError] = React.useState<string | null>(null);
  const [voteDelta, setVoteDelta] = React.useState<Record<string, { up: number; down: number }>>({});
  const [commentPreview, setCommentPreview] = React.useState<Record<string, string>>({});
  const [commentPreviewLoading, setCommentPreviewLoading] = React.useState(false);
  const [userVotes, setUserVotes] = React.useState<Record<string, 0 | 1 | -1>>({});

  // Load 1 most recent comment per post (preview)
  React.useEffect(() => {
    let cancelled = false;
    async function loadPreviews() {
      if (!data || data.length === 0) { setCommentPreview({}); return; }
      setCommentPreviewLoading(true);
      const ids = data.map((p) => p.id);
      const { data: comments, error } = await supabase
        .from("comments")
        .select("post_id, body, created_at")
        .in("post_id", ids)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (!error && comments) {
        const firstByPost: Record<string, string> = {};
        for (const c of comments) {
          const pid = (c as any).post_id as string;
          if (!firstByPost[pid]) firstByPost[pid] = (c as any).body as string;
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

  async function vote(postId: string, value: 1 | -1) {
    if (!user) { setVoteError("Please log in to vote"); return; }
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
        setVoteDelta((prev) => {
          const curr = prev[postId] ?? { up: 0, down: 0 };
          return {
            ...prev,
            [postId]: {
              up: curr.up + (value === 1 ? -1 : 0),
              down: curr.down + (value === -1 ? -1 : 0),
            },
          };
        });
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
        setVoteDelta((prev) => {
          const curr = prev[postId] ?? { up: 0, down: 0 };
          let up = curr.up;
          let down = curr.down;
          if (previous === 1 && value === -1) { up -= 1; down += 1; }
          else if (previous === -1 && value === 1) { down -= 1; up += 1; }
          else if (previous === 0) { if (value === 1) up += 1; else down += 1; }
          return { ...prev, [postId]: { up, down } };
        });
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
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="top">Top</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="app-card">
        {loading && <div className="text-sm text-gray-700">Loading...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && !error && (
          <ul className="space-y-3">
            {data.map((p) => (
              <li key={p.id} className="border-b border-gray-200 pb-3">
                <div className="min-w-0">
                  <Link href={`/ideas/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                  <p className="mt-1 text-sm text-gray-700 line-clamp-3">{p.body}</p>
                  <div className="mt-2 text-xs text-gray-600 flex items-center gap-4">
                    <button
                      type="button"
                      className="hover:underline disabled:opacity-50"
                      onClick={() => vote(p.id, 1)}
                      disabled={!user || votingFor === p.id}
                    >
                      👍 {(voteDelta[p.id]?.up ?? 0) + p.up_count}
                    </button>
                    <button
                      type="button"
                      className="hover:underline disabled:opacity-50"
                      onClick={() => vote(p.id, -1)}
                      disabled={!user || votingFor === p.id}
                    >
                      👎 {(voteDelta[p.id]?.down ?? 0) + p.down_count}
                    </button>
                    {voteError && <span className="text-red-600">{voteError}</span>}
                  </div>
                  {commentPreviewLoading ? (
                    <div className="mt-2 text-xs text-gray-600">Loading comments…</div>
                  ) : commentPreview[p.id] ? (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-gray-700">Latest comment</div>
                      <p className="mt-1 text-sm text-gray-800 line-clamp-3 whitespace-pre-wrap">{commentPreview[p.id]}</p>
                      <Link href={`/ideas/${p.id}`} className="text-xs underline text-gray-700 mt-1 inline-block">See more</Link>
                    </div>
                  ) : null}
                </div>
                {user && (
                  <form
                    className="mt-3 space-y-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
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
                    <Textarea name="body" rows={3} placeholder="Add a comment" />
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

      <div className="flex items-center gap-3">
        <Link href="/ideas/new" className="underline text-sm">Create new idea</Link>
      </div>
    </section>
  );
}


