import createClient from "openapi-fetch";
import type { paths } from "@/types/ideaboard-api";
import { supabase } from "@/lib/supabaseClient";

// Singleton typed client
export const client = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
});

// Helper to attach Authorization header using Supabase session access token
export async function withAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (accessToken) {
    return { Authorization: `Bearer ${accessToken}` };
  }
  return {};
}


