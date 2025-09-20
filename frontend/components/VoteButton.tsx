"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

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

  async function vote(value: 1 | -1) {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setLoading(false); return; }
    const payload: any = { user_id: auth.user.id, value };
    if (postId) payload.post_id = postId;
    if (commentId) payload.comment_id = commentId;
    const { error } = await supabase.from("votes").upsert(payload, { onConflict: postId ? "user_id,post_id" : "user_id,comment_id" });
    if (!error) {
      if (value === 1) setUp((v) => v + 1);
      else setDown((v) => v + 1);
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={loading} onClick={() => vote(1)}>⬆ {up}</Button>
      <Button size="sm" disabled={loading} onClick={() => vote(-1)}>⬇ {down}</Button>
    </div>
  );
}

export default VoteButton;


