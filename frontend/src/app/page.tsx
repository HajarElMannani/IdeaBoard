"use client";
import { useState } from "react";
import { usePosts } from "@/lib/hooks/usePosts";
import VoteButton from "@/components/VoteButton";
import ReportDialog from "@/components/ReportDialog";

export default function Page() {
  const [sort, setSort] = useState<"new" | "top">("new");
  const [reportPostId, setReportPostId] = useState<string | null>(null);
  const { data, isLoading, error } = usePosts({ sort, page: 1, page_size: 20, status: "published" });

  const items = data?.items ?? [];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ideas ({sort === "new" ? "New" : "Top"})</h1>
        <div className="inline-flex rounded border overflow-hidden">
          <button
            type="button"
            onClick={() => setSort("new")}
            className={`px-3 py-1 text-sm ${sort === "new" ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
          >
            New
          </button>
          <button
            type="button"
            onClick={() => setSort("top")}
            className={`px-3 py-1 text-sm border-l ${sort === "top" ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
          >
            Top
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="text-sm text-gray-600">Loading…</div>
      )}
      {error && (
        <div className="text-sm text-red-600">Failed to load posts.</div>
      )}
      {!isLoading && !error && items.length === 0 && (
        <div className="text-sm text-gray-600">No posts yet.</div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <ul className="space-y-2">
          {items.map(p => (
            <li key={p.id} className="rounded border p-3">
              <div className="font-semibold">{p.title}</div>
              <div className="text-sm text-gray-600">{p.body}</div>
              <div className="mt-2">
                <VoteButton post={p} />
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setReportPostId(p.id)}
                  className="text-xs text-gray-600 underline"
                >
                  Report
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ReportDialog
        open={Boolean(reportPostId)}
        postId={reportPostId}
        onClose={() => setReportPostId(null)}
      />
    </section>
  );
}
