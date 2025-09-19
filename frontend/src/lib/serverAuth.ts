import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options, expires: new Date(0) });
        },
      },
    }
  );
}

export async function getServerSession(): Promise<Session | null> {
  try {
    const supabase = getServerSupabase();
    const { data } = await supabase.auth.getSession();
    return data.session ?? null;
  } catch {
    return null;
  }
}

export async function requireServerAuth(): Promise<Session> {
  const session = await getServerSession();
  if (!session) {
    redirect("/auth");
  }
  return session;
}


