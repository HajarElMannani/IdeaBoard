"use client";
import { supabase } from "@/lib/supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useEffect } from "react";

export default function AuthPage() {
  useEffect(() => {
    // Optional: after login, ensure a row exists in public.users
    const sub = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const id = session?.user?.id;
      if (id) {
        await supabase.from("users").upsert({ id }, { onConflict: "id" });
      }
    });
    return () => { sub.data.subscription.unsubscribe(); };
  }, []);

  return (
    <div className="max-w-md mx-auto p-6">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        providers={[]}
        redirectTo={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}
      />
    </div>
  );
}
