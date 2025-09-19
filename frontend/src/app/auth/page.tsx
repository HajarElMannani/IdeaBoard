"use client";
import { supabase } from "@/lib/supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useEffect } from "react";
import { Card } from "@/components/UI";

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
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          redirectTo={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}
        />
        </Card>
      </div>
    </div>
  );
}
