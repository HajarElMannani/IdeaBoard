"use client";
import { supabase } from "@/lib/supabaseClient";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useEffect } from "react";
import { Card } from "@/components/UI";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const search = useSearchParams();
  const redirect = search?.get("redirect") || "/";
  const viewParam = (search?.get("view") || "sign_in") as "sign_in" | "sign_up" | "magic_link" | "forgotten_password";

  useEffect(() => {
    // Redirect ONLY when a fresh sign-in occurs; don't redirect on initial session check
    const sub = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user?.id) {
        const id = session.user.id;
        await supabase.from("users").upsert({ id }, { onConflict: "id" });
        router.push(redirect);
      }
    });
    return () => { sub.data.subscription.unsubscribe(); };
  }, [redirect, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={[]}
          redirectTo={process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}
          view={viewParam}
        />
        </Card>
      </div>
    </div>
  );
}
