import { supabase } from "@/lib/supabaseClient";

export async function ensureUserRow() {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return;
  const username = (user.user_metadata as any)?.username || null;
  // Prefer a SECURITY DEFINER RPC to bypass RLS cleanly if present
  try {
    const { error } = await supabase.rpc("ensure_user_exists", {
      p_uid: user.id,
      p_username: username,
    });
    // Always return; if RPC fails, we do NOT attempt a direct table write to avoid 403s
    return;
  } catch (_) {}
}


