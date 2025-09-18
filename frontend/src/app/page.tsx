"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function Page() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("posts")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setPosts(data ?? []);
      });
  }, []);
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Ideas (New)</h1>
      <ul className="space-y-2">
        {posts.map(p => (
          <li key={p.id} className="rounded border p-3">
            <div className="font-semibold">{p.title}</div>
            <div className="text-sm text-gray-600">{p.body}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
