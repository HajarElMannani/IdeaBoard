"use client";
import { useVote } from "@/lib/hooks/useVote";
import type { components } from "@/types/ideaboard-api";

type Post = components["schemas"]["Post"];

export default function VoteButton({ post }: { post: Post }) {
  const { upvote, downvote, isPending } = useVote();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="rounded border px-2 py-1 text-sm disabled:opacity-50"
        onClick={() => upvote(post.id)}
        disabled={isPending}
      >
        ⬆ {post.up_count}
      </button>
      <button
        type="button"
        className="rounded border px-2 py-1 text-sm disabled:opacity-50"
        onClick={() => downvote(post.id)}
        disabled={isPending}
      >
        ⬇ {post.down_count}
      </button>
    </div>
  );
}


