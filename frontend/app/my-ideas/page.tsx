"use client";
import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/hooks/useSession";
import { supabase } from "@/lib/supabaseClient";

type MyPost = {
  id: string;
  title: string;
  created_at: string;
  up_count: number;
  down_count: number;
};

export default function MyIdeasPage() {
  const { user, loading } = useSession();
  const [posts, setPosts] = React.useState<MyPost[]>([]);
  const [commentsCount, setCommentsCount] = React.useState<Record<string, number>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [loadingList, setLoadingList] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) { setPosts([]); setCommentsCount({}); setLoadingList(false); return; }
      setLoadingList(true);
      setError(null);
      const { data, error } = await supabase
        .from("posts")
        .select("id,title,created_at,up_count,down_count")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        setError(error.message);
        setPosts([]);
        setCommentsCount({});
      } else {
        const list = (data ?? []) as MyPost[];
        setPosts(list);
        // fetch comments count per post
        const countsEntries = await Promise.all(
          list.map(async (p) => {
            const { count } = await supabase
              .from("comments")
              .select("id", { count: "exact", head: true })
              .eq("post_id", p.id)
              .eq("status", "published");
            return [p.id, count ?? 0] as const;
          })
        );
        if (!cancelled) {
          setCommentsCount(Object.fromEntries(countsEntries));
        }
      }
      setLoadingList(false);
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <section className="space-y-6 md:space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">My ideas</h1>
        <p className="mt-1 text-sm text-gray-600">Your ideas with votes and comments.</p>
      </div>

      <Card className="app-card">
        {loading && <div className="text-sm text-gray-700">Loading session…</div>}
        {!loading && !user && <div className="text-sm text-red-600">You must log in to view your ideas.</div>}
        {!loading && user && (
          <>
            {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
            {loadingList && <div className="text-sm text-gray-700">Loading ideas…</div>}
            {!loadingList && (
              <ul className="space-y-3">
                {posts.map((p) => (
                  <li key={p.id} className="border-b border-gray-200 pb-3">
                    <Link href={`/ideas/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                    <div className="mt-1 text-xs text-gray-600">
                      👍 {p.up_count} · 👎 {p.down_count} · 💬 {commentsCount[p.id] ?? 0}
                    </div>
                  </li>
                ))}
                {posts.length === 0 && <li className="text-sm text-gray-700">You haven't created any ideas yet.</li>}
              </ul>
            )}
          </>
        )}
      </Card>
    </section>
  );
}


