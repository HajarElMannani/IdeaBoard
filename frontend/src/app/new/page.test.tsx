import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewIdea from "./page";
import { useRouter } from "next/navigation";
import { client, withAuthHeaders } from "@/lib/apiClient";
import { supabase } from "@/lib/supabaseClient";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/apiClient", () => ({
  client: { POST: vi.fn() },
  withAuthHeaders: vi.fn(),
}));

vi.mock("@/lib/supabaseClient", () => ({
  supabase: { auth: { getSession: vi.fn() } },
}));

describe("NewIdea form", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Default: authenticated
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { access_token: "tok" } } });
    (withAuthHeaders as any).mockResolvedValue({ Authorization: "Bearer tok" });
    (client.POST as any).mockResolvedValue({ data: { id: "1" }, error: null, response: { status: 201 } });
    (useRouter as any).mockReturnValue({ push: vi.fn() });
  });

  it("validates required fields", async () => {
    render(<NewIdea />);
    fireEvent.click(screen.getByRole("button", { name: /post/i }));
    expect(await screen.findByText(/Title must be at least 3/i)).toBeInTheDocument();
    expect(await screen.findByText(/Body must be at least 3/i)).toBeInTheDocument();
  });

  it("shows error when unauthenticated", async () => {
    // Keep session present, but API returns 401
    (client.POST as any).mockResolvedValue({ data: null, error: new Error("Unauthorized"), response: { status: 401 } });
    render(<NewIdea />);
    fireEvent.change(screen.getByPlaceholderText(/Title/i), { target: { value: "Hello" } });
    fireEvent.change(screen.getByPlaceholderText(/Describe your idea/i), { target: { value: "World" } });
    fireEvent.click(screen.getByRole("button", { name: /post/i }));
    expect(await screen.findByText(/Please sign in to post/i)).toBeInTheDocument();
  });

  it("navigates to home and clears form on success", async () => {
    const push = vi.fn();
    (useRouter as any).mockReturnValue({ push });

    render(<NewIdea />);
    const title = screen.getByPlaceholderText(/Title/i) as HTMLInputElement;
    const body = screen.getByPlaceholderText(/Describe your idea/i) as HTMLTextAreaElement;
    fireEvent.change(title, { target: { value: "Hello world" } });
    fireEvent.change(body, { target: { value: "Longer body" } });
    fireEvent.click(screen.getByRole("button", { name: /post/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect(title.value).toBe("");
    expect(body.value).toBe("");
  });
});


