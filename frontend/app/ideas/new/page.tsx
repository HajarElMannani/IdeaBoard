"use client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { useSession } from "@/lib/hooks/useSession";
import { createPost } from "@/lib/hooks/usePosts";
import { useRouter } from "next/navigation";
import { ensureUserRow } from "@/lib/user";

export default function NewIdeaPage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="app-card">
        <h1 className="text-2xl font-semibold">New Idea</h1>
        {!sessionLoading && !user && (
          <p className="mt-2 text-sm text-red-600">You must log in to create an idea.</p>
        )}
        <form className="mt-4 space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          if (!user) return;
          setLoading(true);
          setError(null);
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const title = String(fd.get("title") || "").trim();
          const body = String(fd.get("body") || "").trim();
          const tagsStr = String(fd.get("tags") || "").trim();
          const tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean) : [];
          try {
            await ensureUserRow();
            await createPost({ title, body, tags });
            router.push("/ideas");
          } catch (err: any) {
            setError(err.message || "Failed to create idea");
          } finally {
            setLoading(false);
          }
        }}>
          <div>
            <label className="block text-sm mb-1">Title</label>
            <Input name="title" placeholder="Concise and descriptive" required disabled={!user || loading} />
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <Textarea name="body" rows={6} placeholder="Describe your idea and why it matters" required disabled={!user || loading} />
          </div>
          <div>
            <label className="block text-sm mb-1">Tags (comma separated)</label>
            <Input name="tags" placeholder="ui, performance" disabled={!user || loading} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-end">
            <Button variant="solid" disabled={!user || loading}>Submit</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}


