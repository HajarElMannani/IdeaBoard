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
  users?: { username?: string | null } | null;
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
        .select("id,post_id,body,author_id,created_at,up_count,down_count, users:users!comments_author_id_fkey(username)", { count: "exact" })
        .eq("post_id", postId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .range(from, to);
      if (cancelled) return;
      if (error) setError(error.message);
      else {
        const mapped: Comment[] = (data ?? []).map((r: any) => ({
          id: r.id,
          post_id: r.post_id,
          body: r.body,
          author_id: r.author_id,
          created_at: r.created_at,
          up_count: r.up_count ?? 0,
          down_count: r.down_count ?? 0,
          users: r.users
            ? (Array.isArray(r.users)
                ? (r.users[0] ? { username: r.users[0]?.username ?? null } : null)
                : { username: (r.users as any)?.username ?? null })
            : null,
        }));
        setData(mapped);
        setCount(count ?? 0);
      }
      setLoading(false);
    }
    if (postId) load();
    return () => { cancelled = true; };
  }, [postId, page, pageSize]);

  // Realtime updates for comments on this post
  React.useEffect(() => {
    if (!postId) return;
    const channel = supabase
      .channel(`comments-realtime-${postId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        async (payload: any) => {
          const row = payload.new as any;
          if (!row || row.post_id !== postId) return;
          if (row.status && row.status !== "published") return;
          let username: string | null = null;
          try {
            const { data: userRow } = await supabase
              .from("users")
              .select("username")
              .eq("id", row.author_id)
              .maybeSingle();
            if (userRow) username = (userRow as any).username ?? null;
          } catch (_e) {
            // ignore lookup errors; username will be null
          }
          setData((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            return [{
              id: row.id,
              post_id: row.post_id,
              body: row.body,
              author_id: row.author_id,
              created_at: row.created_at,
              up_count: row.up_count ?? 0,
              down_count: row.down_count ?? 0,
              users: username !== null ? { username } : null,
            }, ...prev];
          });
          setCount((n) => n + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "comments" },
        async (payload: any) => {
          const row = payload.new as any;
          if (!row || row.post_id !== postId) return;
          let username: string | null = null;
          try {
            const { data: userRow } = await supabase
              .from("users")
              .select("username")
              .eq("id", row.author_id)
              .maybeSingle();
            if (userRow) username = (userRow as any).username ?? null;
          } catch (_e) {}
          setData((prev) => prev.map((c) => c.id === row.id ? {
            ...c,
            body: row.body ?? c.body,
            up_count: row.up_count ?? c.up_count,
            down_count: row.down_count ?? c.down_count,
            users: username !== null ? { username } : c.users ?? null,
          } : c));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "comments" },
        (payload: any) => {
          const row = payload.old as any;
          if (!row || row.post_id !== postId) return;
          setData((prev) => prev.filter((c) => c.id !== row.id));
          setCount((n) => Math.max(0, n - 1));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

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


