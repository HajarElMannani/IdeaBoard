"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { client } from "@/lib/apiClient";
import { withAuthHeaders } from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { requireAuthClientSide } from "@/lib/auth";
import { Button, Card, Input, Textarea, Badge } from "@/components/UI";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  body: z.string().min(3, "Body must be at least 3 characters"),
  tags: z.array(z.string()).optional(),
});

type Form = z.infer<typeof schema>;

export default function NewIdea() {
  const router = useRouter();
  useEffect(() => { requireAuthClientSide(); }, []);
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", body: "", tags: [] },
  });

  const onSubmit = async (data: Form) => {
    try {
      const headers = await withAuthHeaders();
      const { error, response } = await client.POST("/api/v1/posts", {
        body: { title: data.title, body: data.body, tags: data.tags && data.tags.length ? data.tags : undefined },
        headers,
      });
      if (error) {
        // Show 401/403 visibly
        if (response?.status === 401 || response?.status === 403) {
          setError("root", { type: "auth", message: response.status === 401 ? "Please sign in to post." : "You do not have permission to post." });
          return;
        }
        throw error;
      }
      reset();
      router.push("/");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      setError("root", { message });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Submit a new idea</h1>
      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <Input placeholder="Concise and descriptive" {...register("title")} />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <Textarea rows={6} placeholder="Describe your idea and why it matters" {...register("body")} />
            {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tags</label>
            <Input placeholder="comma-separated, e.g. ui, performance" {...register("tags", {
              setValueAs: (v: unknown) => {
                if (Array.isArray(v)) return v as string[];
                if (typeof v !== "string" || v.length === 0) return [] as string[];
                return v.split(",").map((s: string) => s.trim()).filter(Boolean);
              }
            })} />
            <p className="mt-1 text-xs text-gray-600">Press comma to add. Optional.</p>
          </div>
          {errors.root && <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">{errors.root.message}</div>}
          <div className="flex items-center justify-end">
            <Button disabled={isSubmitting}>{isSubmitting ? "Posting…" : "Post idea"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
