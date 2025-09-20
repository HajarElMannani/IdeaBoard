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
};

export function usePosts(sort: "new" | "top" = "new", page = 1, pageSize = 10) {
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
      let query = supabase.from("posts").select("id,title,body,tags,up_count,down_count,created_at", { count: "exact" }).eq("status", "published");
      if (sort === "new") query = query.order("created_at", { ascending: false });
      if (sort === "top") query = query.order("up_count", { ascending: false });
      const { data, count, error } = await query.range(from, to);
      if (cancelled) return;
      if (error) setError(error.message);
      else {
        setData(data ?? []);
        setCount(count ?? 0);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [sort, page, pageSize]);

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


