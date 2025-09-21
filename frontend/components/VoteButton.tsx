"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { ensureUserRow } from "@/lib/user";

type Props = {
  postId?: string;
  commentId?: string;
  upCount: number;
  downCount: number;
  onRequireLogin?: () => void;
  variant?: "button" | "thumbs";
};

export function VoteButton({ postId, commentId, upCount, downCount, onRequireLogin, variant = "button" }: Props) {
  const [up, setUp] = React.useState(upCount);
  const [down, setDown] = React.useState(downCount);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [userVote, setUserVote] = React.useState<0 | 1 | -1>(0);

  // Keep counts in sync with parent updates
  React.useEffect(() => {
    setUp(upCount);
    setDown(downCount);
  }, [upCount, downCount]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const col = postId ? "post_id" : "comment_id";
      const id = postId ?? commentId ?? "";
      if (!id) return;
      const { data, error } = await supabase
        .from("votes")
        .select("value")
        .eq("user_id", uid)
        .eq(col, id)
        .maybeSingle();
      if (!cancelled && !error && data) setUserVote((data as any).value as 1 | -1);
    })();
    return () => { cancelled = true; };
  }, [postId, commentId]);

  async function vote(value: 1 | -1) {
    setLoading(true);
    setError(null);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      if (onRequireLogin) onRequireLogin();
      else setError("Please log in to vote");
      setLoading(false);
      return;
    }
    await ensureUserRow();
    const targetColumn = postId ? "post_id" : "comment_id";
    const targetId = postId ?? commentId!;

    if (userVote === value) {
      const { error } = await supabase
        .from("votes")
        .delete()
        .eq("user_id", auth.user.id)
        .eq(targetColumn, targetId);
      if (error) setError(error.message);
      else {
        setUserVote(0);
        // Refresh counts from DB (avoid double optimistic + trigger)
        if (postId) {
          const { data } = await supabase.from("posts").select("up_count,down_count").eq("id", postId).maybeSingle();
          if (data) { setUp((data as any).up_count ?? 0); setDown((data as any).down_count ?? 0); }
        } else if (commentId) {
          const { data } = await supabase.from("comments").select("up_count,down_count").eq("id", commentId).maybeSingle();
          if (data) { setUp((data as any).up_count ?? 0); setDown((data as any).down_count ?? 0); }
        }
      }
    } else {
      const payload: any = { user_id: auth.user.id, value };
      (payload as any)[targetColumn] = targetId;
      const { error } = await supabase
        .from("votes")
        .upsert(payload, { onConflict: postId ? "user_id,post_id" : "user_id,comment_id" });
      if (error) setError(error.message);
      else {
        setUserVote(value);
        // Refresh counts from DB
        if (postId) {
          const { data } = await supabase.from("posts").select("up_count,down_count").eq("id", postId).maybeSingle();
          if (data) { setUp((data as any).up_count ?? 0); setDown((data as any).down_count ?? 0); }
        } else if (commentId) {
          const { data } = await supabase.from("comments").select("up_count,down_count").eq("id", commentId).maybeSingle();
          if (data) { setUp((data as any).up_count ?? 0); setDown((data as any).down_count ?? 0); }
        }
      }
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      {commentId || variant === "thumbs" ? (
        <>
          <button
            type="button"
            className="text-xs hover:underline disabled:opacity-50"
            disabled={loading}
            onClick={() => vote(1)}
          >
            👍 {up}
          </button>
          <button
            type="button"
            className="text-xs hover:underline disabled:opacity-50"
            disabled={loading}
            onClick={() => vote(-1)}
          >
            👎 {down}
          </button>
        </>
      ) : (
        <>
          <Button size="sm" disabled={loading} onClick={() => vote(1)}>
            {userVote === 1 ? "✅⬆" : "⬆"} {up}
          </Button>
          <Button size="sm" disabled={loading} onClick={() => vote(-1)}>
            {userVote === -1 ? "✅⬇" : "⬇"} {down}
          </Button>
        </>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export default VoteButton;


