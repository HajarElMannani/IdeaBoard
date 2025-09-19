"use client";
import { useState } from "react";
import { client, withAuthHeaders } from "@/lib/apiClient";

type Props = {
  open: boolean;
  postId: string | null;
  onClose: () => void;
};

export default function ReportDialog({ open, postId, onClose }: Props) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open || !postId) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = reason.trim();
    if (trimmed.length < 3) {
      setError("Reason must be at least 3 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      const headers = await withAuthHeaders();
      const { error: err, response } = await client.POST("/api/v1/reports", {
        body: { post_id: postId, reason: trimmed },
        headers,
      });
      if (err) {
        const status = response?.status;
        if (status === 401) setError("Please sign in to report.");
        else if (status === 403) setError("You do not have permission to report.");
        else setError("Failed to submit report.");
        return;
      }
      setReason("");
      onClose();
      // Optional simple toast
      alert("Report submitted. Thank you.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded bg-white p-4 shadow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Report post</h2>
          <button onClick={onClose} className="text-sm text-gray-600">Close</button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Reason</label>
            <textarea
              className="w-full rounded border p-2"
              rows={5}
              placeholder="Describe the issue"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded border px-3 py-1 text-sm">Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-black px-4 py-2 text-white text-sm disabled:opacity-50"
            >
              {isSubmitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


