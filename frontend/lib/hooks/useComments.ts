"use client";
import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { ensureUserRow } from "@/lib/user";

export type Comment = {
  id: string;
  post_id: string;
  body: string;
  author_id: string;
  created_at: string;
  up_count: number;
  down_count: number;
};

export function useComments(postId: string, page = 1, pageSize = 10) {
  const [data, setData] = React.useState<Comment[]>([]);
  const [count, setCount] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, count, error } = await supabase
        .from("comments")
        .select("id,post_id,body,author_id,created_at,up_count,down_count", { count: "exact" })
        .eq("post_id", postId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .range(from, to);
      if (cancelled) return;
      if (error) setError(error.message);
      else {
        setData(data ?? []);
        setCount(count ?? 0);
      }
      setLoading(false);
    }
    if (postId) load();
    return () => { cancelled = true; };
  }, [postId, page, pageSize]);

  return { data, count, loading, error };
}

export async function addComment(postId: string, body: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  await ensureUserRow();
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: auth.user.id,
    body,
    status: "published",
  });
  if (error) throw new Error(error.message);
}


