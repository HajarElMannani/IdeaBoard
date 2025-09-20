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
};

export function VoteButton({ postId, commentId, upCount, downCount }: Props) {
  const [up, setUp] = React.useState(upCount);
  const [down, setDown] = React.useState(downCount);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [userVote, setUserVote] = React.useState<0 | 1 | -1>(0);

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
    if (!auth.user) { setError("Please log in to vote"); setLoading(false); return; }
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
        if (value === 1) setUp((v) => Math.max(0, v - 1));
        else setDown((v) => Math.max(0, v - 1));
        setUserVote(0);
      }
    } else {
      const payload: any = { user_id: auth.user.id, value };
      (payload as any)[targetColumn] = targetId;
      const { error } = await supabase
        .from("votes")
        .upsert(payload, { onConflict: postId ? "user_id,post_id" : "user_id,comment_id" });
      if (error) setError(error.message);
      else {
        if (userVote === 1 && value === -1) {
          setUp((v) => Math.max(0, v - 1));
          setDown((v) => v + 1);
        } else if (userVote === -1 && value === 1) {
          setDown((v) => Math.max(0, v - 1));
          setUp((v) => v + 1);
        } else if (userVote === 0) {
          if (value === 1) setUp((v) => v + 1);
          else setDown((v) => v + 1);
        }
        setUserVote(value);
      }
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={loading} onClick={() => vote(1)}>{userVote === 1 ? "✅⬆" : "⬆"} {up}</Button>
      <Button size="sm" disabled={loading} onClick={() => vote(-1)}>{userVote === -1 ? "✅⬇" : "⬇"} {down}</Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

export default VoteButton;


