"use client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import * as React from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import VoteButton from "@/components/VoteButton";
import { useComments, addComment } from "@/lib/hooks/useComments";
import { useSession } from "@/lib/hooks/useSession";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateTimeNoSeconds } from "@/lib/format";

export default function IdeaDetailPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const router = useRouter();
  const { user } = useSession();
  const [post, setPost] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { data: comments, loading: commentsLoading, error: commentsError } = useComments(id);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("posts")
        .select("id,title,body,tags,up_count,down_count,created_at,author_id")
        .eq("id", id)
        .single();
      if (cancelled) return;
      if (error) setError(error.message);
      else setPost(data);
      setLoading(false);
    }
    if (id) load();
    return () => { cancelled = true; };
  }, [id]);

  // Realtime: update post counts and live comments for this idea
  React.useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`idea-detail-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload: any) => {
          const row = payload.new as any;
          if (row?.id !== id) return;
          setPost((p: any) => p ? {
            ...p,
            up_count: row.up_count ?? p.up_count,
            down_count: row.down_count ?? p.down_count,
            title: row.title ?? p.title,
            body: row.body ?? p.body,
            tags: Array.isArray(row.tags) ? row.tags : p.tags,
          } : p);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
      <Card className="app-card">
        {loading && <div className="text-sm text-gray-700">Loading...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {post && (
          <>
            <h1 className="text-2xl md:text-3xl font-semibold">{post.title}</h1>
            <div className="text-xs text-gray-600 mt-1">by {/* username hidden here unless joined; fallback */} {post.author_id ? "user" : "user"} · {formatDateTimeNoSeconds(post.created_at)}</div>
            <p className="mt-3 text-gray-700 leading-relaxed whitespace-pre-wrap">{post.body}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">{(post.tags || []).join(", ")}</div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span>💬 {Array.isArray(comments) ? comments.length : 0}</span>
                {user?.id === post.author_id && (
                  <>
                    <Link href={`/ideas/${post.id}/edit`} className="text-sm underline">Edit</Link>
                    <button
                      type="button"
                      className="text-sm text-red-600 underline"
                      onClick={async () => {
                        if (!confirm("Delete this idea?")) return;
                        const { error } = await supabase.from("posts").delete().eq("id", post.id);
                        if (!error) router.push("/ideas");
                        else alert(error.message);
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
                <VoteButton postId={post.id} upCount={post.up_count} downCount={post.down_count} />
              </div>
            </div>
          </>
        )}
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Comments</h2>
        <Card className="app-card">
          {commentsLoading && <div className="text-sm text-gray-700">Loading comments...</div>}
          {commentsError && <div className="text-sm text-red-600">{commentsError}</div>}
          {!commentsLoading && !commentsError && (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="border-b border-gray-200 pb-3">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.body}</p>
                  <div className="text-xs text-gray-600 mt-2 flex items-center gap-3">
                    <VoteButton commentId={c.id} upCount={c.up_count} downCount={c.down_count} />
                    <div>by {c.users?.username || 'user'} · {formatDateTimeNoSeconds(c.created_at)}</div>
                  </div>
                </li>
              ))}
              {comments.length === 0 && <li className="text-sm text-gray-700">No comments yet.</li>}
            </ul>
          )}
        </Card>
        <Card className="app-card">
          <form className="space-y-2" onSubmit={async (e) => {
            e.preventDefault();
            if (!user || !id) return;
            const formEl = e.currentTarget as HTMLFormElement;
            const fd = new FormData(formEl);
            const body = String(fd.get("body") || "").trim();
            if (!body) return;
            try {
              await addComment(id, body);
              formEl.reset();
            } catch (err: any) {
              alert(err.message || "Failed to add comment");
            }
          }}>
            <Textarea name="body" rows={4} placeholder="Write a comment" disabled={!user} />
            <div className="flex items-center justify-end">
              <Button variant="solid" disabled={!user}>Post Comment</Button>
            </div>
          </form>
        </Card>
      </section>
    </div>
  );
}


