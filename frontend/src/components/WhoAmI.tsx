"use client";
import { useState } from "react";
import { client, withAuthHeaders } from "@/lib/apiClient";

type MeResponse = {
  email?: string;
  role?: string;
  [key: string]: unknown;
};

export default function WhoAmI() {
  const [result, setResult] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchMe = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const headers = await withAuthHeaders();
      const { data, error, response } = await client.GET("/api/v1/me", { headers });
      if (error) {
        if (response?.status === 401) {
          setError("not logged in");
          return;
        }
        setError("failed to fetch");
        return;
      }
      setResult(data as unknown as MeResponse);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={fetchMe}
        className="px-2 py-1 text-sm border rounded"
        disabled={loading}
      >
        {loading ? "Loading…" : "Who am I?"}
      </button>
      {error && <span className="text-sm text-gray-600">{error}</span>}
      {result && (
        <span className="text-sm text-gray-800">
          {result.email ? `${result.email}` : "unknown"}
          {result.role ? ` (${result.role})` : ""}
        </span>
      )}
    </div>
  );
}


