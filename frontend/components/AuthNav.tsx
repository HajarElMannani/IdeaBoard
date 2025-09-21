"use client";
import Link from "next/link";
import { useSession } from "@/lib/hooks/useSession";
import { supabase } from "@/lib/supabaseClient";

export default function AuthNav() {
  const { user, loading } = useSession();
  if (loading) return null;
  if (user) {
    return (
      <>
        <Link href="/ideas/new">New</Link>
        <Link href="/profile">Profile</Link>
        <Link href="/my-ideas">My ideas</Link>
        <button
          type="button"
          className="text-gray-800 hover:underline"
          onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
        >
          Log out
        </button>
      </>
    );
  }
  return (
    <>
      <Link href="/auth">Log in</Link>
      <Link href="/auth?tab=register">Sign up</Link>
    </>
  );
}


