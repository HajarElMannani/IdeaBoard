"use client";
import * as React from "react";
import { supabase } from "@/lib/supabaseClient";

export type Post = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  up_count: number;
  down_count: number;
  created_at: string;
  users?: { username?: string | null } | null;
};

export function usePosts(
  sort: "new" | "top" = "new",
  page = 1,
  pageSize = 10,
  opts?: { search?: string; tag?: string }
) {
  const [data, setData] = React.useState<Post[]>([]);
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
      let query = supabase
        .from("posts")
        .select("id,title,body,tags,up_count,down_count,created_at, users:users!posts_author_id_fkey(username)", { count: "exact" })
        .eq("status", "published");
      if (opts?.tag) {
        query = query.contains("tags", [opts.tag]);
      }
      if (opts?.search) {
        // Use ILIKE on title/body for simplicity (tsv exists if you want to switch to text search)
        const term = `%${opts.search}%`;
        query = query.or(`title.ilike.${term},body.ilike.${term}`);
      }
      if (sort === "new") query = query.order("created_at", { ascending: false });
      if (sort === "top") query = query.order("up_count", { ascending: false });
      const { data, count, error } = await query.range(from, to);
      if (cancelled) return;
      if (error) setError(error.message);
      else {
        const mapped: Post[] = (data ?? []).map((r: any) => ({
          id: r.id,
          title: r.title,
          body: r.body,
          tags: Array.isArray(r.tags) ? r.tags : [],
          up_count: r.up_count ?? 0,
          down_count: r.down_count ?? 0,
          created_at: r.created_at,
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
    load();
    return () => { cancelled = true; };
  }, [sort, page, pageSize, opts?.search, opts?.tag]);

  // Realtime updates for votes and new posts
  React.useEffect(() => {
    const channel = supabase
      .channel("posts-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "posts" },
        (payload: any) => {
          const row = payload.new as any;
          // Update counts and fields for posts visible in current page
          setData((prev) => prev.map((p) => p.id === row.id ? {
            ...p,
            title: row.title ?? p.title,
            body: row.body ?? p.body,
            tags: Array.isArray(row.tags) ? row.tags : p.tags,
            up_count: row.up_count ?? p.up_count,
            down_count: row.down_count ?? p.down_count,
            created_at: row.created_at ?? p.created_at,
            users: p.users ?? null,
          } : p));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload: any) => {
          const row = payload.new as any;
          // Only add if matches current filters; otherwise rely on next fetch
          const matchesTag = !opts?.tag || (Array.isArray(row.tags) && row.tags.includes(opts.tag));
          const matchesSearch = !opts?.search || (
            (row.title ?? "").toLowerCase().includes(opts.search.toLowerCase()) ||
            (row.body ?? "").toLowerCase().includes(opts.search.toLowerCase())
          );
          const matches = (row.status === "published") && matchesTag && matchesSearch;
          if (!matches) return;
          setData((prev) => {
            if (prev.some((p) => p.id === row.id)) return prev;
            const inserted: Post = {
              id: row.id,
              title: row.title,
              body: row.body,
              tags: Array.isArray(row.tags) ? row.tags : [],
              up_count: row.up_count ?? 0,
              down_count: row.down_count ?? 0,
              created_at: row.created_at,
              users: null,
            };
            // For "new" tab, put at top; for "top", let next fetch reorder
            if (sort === "new") return [inserted, ...prev];
            return [...prev, inserted];
          });
          setCount((n) => n + 1);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "posts" },
        (payload: any) => {
          const row = payload.old as any;
          setData((prev) => prev.filter((p) => p.id !== row.id));
          setCount((n) => Math.max(0, n - 1));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [opts?.search, opts?.tag, sort]);

  return { data, count, loading, error };
}

export async function createPost(input: { title: string; body: string; tags: string[] }) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  const { error } = await supabase.from("posts").insert({
    author_id: auth.user.id,
    title: input.title,
    body: input.body,
    tags: input.tags,
    status: "published",
  });
  if (error) throw new Error(error.message);
}


