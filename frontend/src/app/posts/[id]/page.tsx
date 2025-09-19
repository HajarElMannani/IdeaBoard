"use client";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/apiClient";
import { useComments, useAddComment } from "@/lib/hooks/useComments";

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = params?.id as string;
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { data: post, isLoading: postLoading, error: postError } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const { data, error } = await client.GET("/api/v1/posts/{postId}", { params: { path: { postId } } });
      if (error) throw error;
      return data;
    },
    enabled: Boolean(postId),
  });

  const { data: commentsData, isLoading: commentsLoading, error: commentsError } = useComments(postId, { page, page_size: pageSize });
  const addComment = useAddComment(postId);
  const [commentBody, setCommentBody] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    try {
      await addComment.mutateAsync({ body: commentBody.trim() });
      setCommentBody("");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } } | null)?.response?.status;
      if (status === 401) alert("Please sign in to comment.");
      else if (status === 403) alert("You do not have permission to comment.");
      else alert("Failed to add comment.");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4">
      {postLoading && <div className="text-sm text-gray-600">Loading post…</div>}
      {postError && <div className="text-sm text-red-600">Failed to load post.</div>}
      {post && (
        <article className="rounded border p-4">
          <h1 className="text-2xl font-bold">{post.title}</h1>
          <p className="mt-2 text-gray-700">{post.body}</p>
        </article>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Comments</h2>
        {commentsLoading && <div className="text-sm text-gray-600">Loading comments…</div>}
        {commentsError && <div className="text-sm text-red-600">Failed to load comments.</div>}
        {!commentsLoading && !commentsError && (commentsData?.items?.length ?? 0) === 0 && (
          <div className="text-sm text-gray-600">No comments yet.</div>
        )}
        {!commentsLoading && !commentsError && (commentsData?.items?.length ?? 0) > 0 && (
          <ul className="space-y-2">
            {commentsData!.items.map(c => (
              <li key={c.id} className="rounded border p-3">
                <div className="text-sm text-gray-800">{c.body}</div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm disabled:opacity-50"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Prev
          </button>
          <span className="text-sm">Page {page}</span>
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm"
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-2">
          <textarea
            className="w-full rounded border p-2"
            rows={4}
            placeholder="Write a comment"
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
          />
          <button
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
            disabled={addComment.isPending}
          >
            {addComment.isPending ? "Posting…" : "Post Comment"}
          </button>
        </form>
      </section>
    </div>
  );
}


