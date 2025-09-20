"use client";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/hooks/useSession";
import * as React from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const { user, loading } = useSession();
  const [ideas, setIdeas] = React.useState<any[]>([]);
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      const { data } = await supabase.from("posts").select("id,title,created_at").eq("author_id", user.id).order("created_at", { ascending: false }).limit(10);
      if (!cancelled) setIdeas(data ?? []);
    }
    load();
    return () => { cancelled = true; };
  }, [user]);
  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
      <Card className="app-card">
        <h1 className="text-2xl font-semibold">Your Profile</h1>
        <div className="mt-2 text-sm text-gray-700">{loading ? "Loading..." : user ? user.email : "Not signed in"}</div>
      </Card>
      <Card className="app-card">
        <h2 className="text-lg font-semibold">Your Ideas</h2>
        <ul className="mt-2 text-sm text-gray-700 space-y-2">
          {ideas.map((p) => (<li key={p.id}>{p.title}</li>))}
          {ideas.length === 0 && <li>No ideas yet.</li>}
        </ul>
      </Card>
      <Card className="app-card">
        <h2 className="text-lg font-semibold">Recent Comments</h2>
        <div className="mt-2 text-sm text-gray-700">[List placeholder]</div>
      </Card>
    </div>
  );
}


