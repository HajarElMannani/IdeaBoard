import { supabase } from "@/lib/supabaseClient";

export async function ensureUserRow() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return;
  // Upsert minimal user record so FK constraints on posts/comments pass
  await supabase.from("users").upsert({ id: user.id }, { onConflict: "id" });
}


