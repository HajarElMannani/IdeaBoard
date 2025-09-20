import { supabase } from "@/lib/supabaseClient";

export async function ensureUserRow() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return;
  const username = (user.user_metadata as any)?.username || null;
  // Upsert minimal user record so FK constraints on posts/comments pass, and store username if available
  await supabase
    .from("users")
    .upsert({ id: user.id, username }, { onConflict: "id", returning: "minimal" });
}


