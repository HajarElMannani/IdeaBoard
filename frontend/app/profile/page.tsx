"use client";
import { Card } from "@/components/ui/card";
import { useSession } from "@/lib/hooks/useSession";
import * as React from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProfilePage() {
  const { user, loading } = useSession();
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pwOpen, setPwOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      setEmail(user.email || "");
      const { data } = await supabase
        .from("users")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      if (!cancelled && data) setUsername((data as any).username ?? "");
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    const { error } = await supabase
      .from("users")
      .upsert({ id: user.id, username }, { onConflict: "id" });
    if (error) setError(error.message);
    else setMessage("Profile updated.");
    setSaving(false);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
      <Card className="app-card">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your account information and security.</p>
      </Card>

      <Card className="app-card">
        <h2 className="text-lg font-semibold">Account</h2>
        <form className="mt-3 space-y-3" onSubmit={saveProfile}>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <div className="text-sm text-gray-800">{email}</div>
          </div>
          <div>
            <label className="block text-sm mb-1">Username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="yourname" />
          </div>
          <div className="flex items-center justify-end gap-3">
            {error && <span className="text-xs text-red-600">{error}</span>}
            {message && <span className="text-xs text-green-600">{message}</span>}
            <Button variant="solid" size="sm" type="submit" disabled={saving || loading}>Save changes</Button>
          </div>
        </form>
      </Card>

      <Card className="app-card">
        <h2 className="text-lg font-semibold">Security</h2>
        <p className="text-sm text-gray-600 mt-1">Update your password.</p>
        <div className="mt-3">
          <Button size="sm" onClick={() => setPwOpen(true)}>Change password</Button>
        </div>
      </Card>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
          </DialogHeader>
          <PasswordForm onClose={() => setPwOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PasswordForm({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!currentPassword) { setError("Current password is required"); return; }
    if (!newPassword || newPassword !== confirmPassword) { setError("New passwords do not match"); return; }
    setSaving(true);

    // Re-authenticate using current password
    const { data: session } = await supabase.auth.getSession();
    const email = session.session?.user.email;
    if (!email) { setError("Not authenticated"); setSaving(false); return; }
    const signIn = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (signIn.error) { setError("Current password is incorrect"); setSaving(false); return; }

    // Update password
    const update = await supabase.auth.updateUser({ password: newPassword });
    if (update.error) setError(update.error.message);
    else {
      setMessage("Password updated.");
      setTimeout(() => onClose(), 800);
    }
    setSaving(false);
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm mb-1">Current password</label>
        <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm mb-1">New password</label>
        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm mb-1">Confirm new password</label>
        <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
      </div>
      <div className="flex items-center justify-end gap-3">
        {error && <span className="text-xs text-red-600">{error}</span>}
        {message && <span className="text-xs text-green-600">{message}</span>}
        <Button variant="ghost" size="sm" type="button" onClick={onClose}>Cancel</Button>
        <Button variant="solid" size="sm" type="submit" disabled={saving}>Update password</Button>
      </div>
    </form>
  );
}


