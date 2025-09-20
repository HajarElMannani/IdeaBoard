"use client";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import * as React from "react";
import { usePosts } from "@/lib/hooks/usePosts";

export default function IdeasPage() {
  const [tab, setTab] = React.useState<"new" | "top">("new");
  const { data, loading, error } = usePosts(tab, 1, 10);
  return (
    <section className="space-y-6 md:space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Ideas</h1>
          <p className="mt-1 text-sm text-gray-600">Browse new and top ideas</p>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList>
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="top">Top</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="app-card">
        {loading && <div className="text-sm text-gray-700">Loading...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {!loading && !error && (
          <ul className="space-y-3">
            {data.map((p) => (
              <li key={p.id} className="border-b border-gray-200 pb-3">
                <Link href={`/ideas/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                <p className="mt-1 text-sm text-gray-700 line-clamp-3">{p.body}</p>
                <div className="mt-2 text-xs text-gray-600">👍 {p.up_count} · 👎 {p.down_count}</div>
              </li>
            ))}
            {data.length === 0 && <li className="text-sm text-gray-700">No ideas yet.</li>}
          </ul>
        )}
      </Card>

      <div className="flex items-center gap-3">
        <Link href="/ideas/new" className="underline text-sm">Create new idea</Link>
      </div>
    </section>
  );
}


