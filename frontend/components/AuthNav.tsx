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
        <Link href="/ideas/new" className="text-indigo-50 hover:text-white">New</Link>
        <Link href="/my-ideas" className="text-indigo-50 hover:text-white">My ideas</Link>
        <Link href="/profile" className="text-indigo-50 hover:text-white">Profile</Link>
        <button
          type="button"
          className="text-indigo-50 hover:text-white"
          onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
        >
          Log out
        </button>
      </>
    );
  }
  return (
    <>
      <Link href="/auth" className="text-indigo-50 hover:text-white">Log in</Link>
      <Link href="/auth?tab=register" className="text-indigo-600 bg-white hover:bg-indigo-50 px-3 py-1 rounded-md">Sign up</Link>
    </>
  );
}


