"use client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useSession } from "@/lib/hooks/useSession";

export default function EditIdeaPage() {
  const params = useParams();
  const id = String(params?.id ?? "");
  const router = useRouter();
  const { user } = useSession();
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [tags, setTags] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,title,body,tags,author_id")
        .eq("id", id)
        .single();
      if (cancelled) return;
      if (error) setError(error.message);
      else {
        if (user?.id !== data.author_id) {
          router.push(`/ideas/${id}`);
          return;
        }
        setTitle(data.title);
        setBody(data.body);
        setTags((data.tags || []).join(", "));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id, user]);

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="app-card">
        <h1 className="text-2xl font-semibold">Edit Idea</h1>
        {loading ? (
          <div className="mt-2 text-sm text-gray-700">Loading…</div>
        ) : (
        <form className="mt-4 space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          const tagsArr = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
          const { error } = await supabase
            .from("posts")
            .update({ title, body, tags: tagsArr })
            .eq("id", id)
            .eq("author_id", user?.id ?? "");
          if (error) setError(error.message);
          else router.push(`/ideas/${id}`);
        }}>
          <div>
            <label className="block text-sm mb-1">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Description</label>
            <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm mb-1">Tags</label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <Button type="button" onClick={() => router.push(`/ideas/${id}`)}>Cancel</Button>
            <Button variant="solid" type="submit" disabled={loading}>Save</Button>
          </div>
        </form>
        )}
      </Card>
    </div>
  );
}


