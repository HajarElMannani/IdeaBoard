"use client";
import { useVote } from "@/lib/hooks/useVote";
import type { components } from "@/types/ideaboard-api";
import { Button } from "@/components/UI";

type Post = components["schemas"]["Post"];

export default function VoteButton({ post }: { post: Post }) {
  const { upvote, downvote, isPending } = useVote();

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={() => upvote(post.id)} disabled={isPending}>
        ⬆ {post.up_count}
      </Button>
      <Button size="sm" onClick={() => downvote(post.id)} disabled={isPending}>
        ⬇ {post.down_count}
      </Button>
    </div>
  );
}


