"use client";
import { useMemo, useState } from "react";
import { usePosts } from "@/lib/hooks/usePosts";
import VoteButton from "@/components/VoteButton";
import ReportDialog from "@/components/ReportDialog";
import { Badge, Button, Card } from "@/components/UI";
import type { components } from "@/types/ideaboard-api";

type Post = components["schemas"]["Post"];

export default function Page() {
  const [sort, setSort] = useState<"new" | "top">("new");
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [reportPostId, setReportPostId] = useState<string | null>(null);

  const queryParams = useMemo(() => ({ sort, page, page_size: pageSize, status: "published" as const, tag: selectedTag }), [sort, page, selectedTag]);
  const { data, isLoading, isFetching, error, refetch } = usePosts(queryParams);

  const items = data?.items ?? [];

  function TagChips({ post }: { post: Post }) {
    const tags = post.tags ?? [];
    if (!tags.length) return null;
    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => { setSelectedTag(tag); setPage(1); }}
            className="focus:outline-none focus:ring-2 focus:ring-black"
            aria-label={`Filter by tag ${tag}`}
          >
            <Badge>{tag}</Badge>
          </button>
        ))}
      </div>
    );
  }

  function PostCard({ post }: { post: Post }) {
    return (
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-tight">{post.title}</h2>
            <p className="mt-1 text-sm text-gray-700 line-clamp-3">{post.body}</p>
            <TagChips post={post} />
            <div className="mt-3 flex items-center justify-between">
              <VoteButton post={post} />
              <Button
                onClick={() => setReportPostId(post.id)}
                className="text-xs px-2 py-1"
                aria-label={`Report post ${post.title}`}
              >
                Report
              </Button>
            </div>
          </div>
          <div className="text-xs text-gray-500 whitespace-nowrap">{new Date(post.created_at).toLocaleString()}</div>
        </div>
      </Card>
    );
  }

  function SkeletonCard() {
    return (
      <Card>
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-1/3 bg-gray-200 rounded" />
          <div className="h-3 w-full bg-gray-200 rounded" />
          <div className="h-3 w-5/6 bg-gray-200 rounded" />
          <div className="h-6 w-24 bg-gray-200 rounded mt-3" />
        </div>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ideas</h1>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded border overflow-hidden">
            <Button
              type="button"
              onClick={() => { setSort("new"); setPage(1); }}
              className={`rounded-none border-0 ${sort === "new" ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
            >
              New
            </Button>
            <Button
              type="button"
              onClick={() => { setSort("top"); setPage(1); }}
              className={`rounded-none border-l-2 ${sort === "top" ? "bg-gray-900 text-white" : "bg-white text-gray-700"}`}
            >
              Top
            </Button>
          </div>
          {selectedTag && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Filter:</span>
              <Badge>{selectedTag}</Badge>
              <Button className="text-xs" onClick={() => { setSelectedTag(undefined); setPage(1); }}>Clear</Button>
            </div>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to load posts.
          <Button className="ml-3 text-xs" onClick={() => refetch()} disabled={isFetching}>Retry</Button>
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <Card>
          <div className="text-sm text-gray-600">No posts yet.</div>
        </Card>
      )}

      {!isLoading && !error && items.length > 0 && (
        <ul className="space-y-2">
          {items.map(p => (
            <li key={p.id}>
              <PostCard post={p} />
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1 || isFetching}
        >
          Prev
        </Button>
        <span className="text-sm">Page {page}</span>
        <Button
          type="button"
          onClick={() => setPage(p => p + 1)}
          disabled={isFetching || (data ? (items.length < pageSize) : false)}
        >
          Next
        </Button>
      </div>
      <div className="p-6 bg-red-500 text-white">tailwind?</div>
      <ReportDialog
        open={Boolean(reportPostId)}
        postId={reportPostId}
        onClose={() => setReportPostId(null)}
      />
    </section>
  );
}
