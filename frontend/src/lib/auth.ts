"use client";
import { supabase } from "@/lib/supabaseClient";

export async function getAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function requireAuthClientSide(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    const isAuthenticated = Boolean(data.session);
    if (!isAuthenticated && typeof window !== "undefined") {
      window.location.assign("/auth");
    }
    return isAuthenticated;
  } catch {
    if (typeof window !== "undefined") {
      window.location.assign("/auth");
    }
    return false;
  }
}


