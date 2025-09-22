"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import * as React from "react";
import { useSearchParams } from "next/navigation";

export default function AuthPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") === "register" ? "register" : "login") as "login" | "register";
  const [tab, setTab] = React.useState<"login" | "register">(initialTab);

  React.useEffect(() => {
    const t = searchParams.get("tab");
    if (t === "login" || t === "register") setTab(t);
  }, [searchParams]);

  async function handleLogin(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else {
      // Redirect to Ideas after login
      window.location.href = "/ideas";
    }
    setLoading(false);
  }

  async function handleRegister(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "").trim();
    const confirmPassword = String(formData.get("confirmPassword") || "").trim();
    const username = String(formData.get("username") || "").trim();

    if (!username) {
      setError("Username is required");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) setError(error.message);
    else {
      setSuccess("Account created. Please log in.");
      setTab("login");
    }
    setLoading(false);
  }
  return (
    <div className="max-w-md mx-auto">
      <div className="app-card">
        <h1 className="text-2xl font-semibold">Authentication</h1>
        <p className="text-sm text-gray-600 mt-1">Log in or create a new account.</p>
        <div className="mt-4">
          {success && <p className="mb-3 text-sm text-green-600">{success}</p>}
          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <div className="mt-4" />
            <TabsContent value="login">
              <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); await handleLogin(fd); }}>
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <Input name="email" type="email" placeholder="you@example.com" required />
                </div>
                <div>
                  <label className="block text-sm mb-1">Password</label>
                  <Input name="password" type="password" placeholder="********" required />
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <Button variant="solid" type="submit" disabled={loading}>Log in</Button>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); await handleRegister(fd); }}>
                <div>
                  <label className="block text-sm mb-1">Username</label>
                  <Input name="username" type="text" placeholder="yourname" required />
                </div>
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <Input name="email" type="email" placeholder="you@example.com" required />
                </div>
                <div>
                  <label className="block text-sm mb-1">Password</label>
                  <Input name="password" type="password" placeholder="********" required />
                </div>
                <div>
                  <label className="block text-sm mb-1">Confirm password</label>
                  <Input name="confirmPassword" type="password" placeholder="********" required />
                </div>
                <div className="mt-2 flex items-center justify-end">
                  <Button variant="solid" type="submit" disabled={loading}>Create account</Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}


