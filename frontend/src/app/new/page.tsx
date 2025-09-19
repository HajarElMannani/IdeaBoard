"use client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { client } from "@/lib/apiClient";
import { withAuthHeaders } from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { requireAuthClientSide } from "@/lib/auth";

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
    <div className="space-y-4 max-w-xl mx-auto">
      <h1 className="text-xl font-semibold">Submit a new idea</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input className="w-full rounded border p-2" placeholder="Title" {...register("title")} />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>
        <div>
          <textarea className="w-full rounded border p-2" rows={6} placeholder="Describe your idea" {...register("body")}/>
          {errors.body && <p className="mt-1 text-sm text-red-600">{errors.body.message}</p>}
        </div>
        <div>
          <input className="w-full rounded border p-2" placeholder="Tags (comma separated, optional)" {...register("tags", {
            setValueAs: (v: string) => {
              if (!v) return [] as string[];
              return v.split(",").map((s: string) => s.trim()).filter(Boolean);
            }
          })} />
        </div>
        {errors.root && <div className="text-sm text-red-600">{errors.root.message}</div>}
        <button disabled={isSubmitting} className="rounded bg-black px-4 py-2 text-white disabled:opacity-50">{isSubmitting ? "Posting..." : "Post"}</button>
      </form>
    </div>
  );
}
