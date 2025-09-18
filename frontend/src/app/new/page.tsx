"use client";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabaseClient";

type Form = { title: string; body: string };

export default function NewIdea() {
  const { register, handleSubmit, reset } = useForm<Form>();
  const onSubmit = async (data: Form) => {
    const { data: sessionData } = await supabase.auth.getUser();
    const userId = sessionData.user?.id;
    if (!userId) { alert("Please sign in first"); return; }

    const { error } = await supabase.from("posts").insert({
      author_id: userId,
      title: data.title,
      body: data.body,
    });
    if (error) { console.error(error); alert(error.message); }
    else { reset(); alert("Posted"); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Submit a new idea</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input className="w-full rounded border p-2" placeholder="Title" {...register("title", { required: true })} />
        <textarea className="w-full rounded border p-2" rows={6} placeholder="Describe your idea" {...register("body", { required: true })}/>
        <button className="rounded bg-black px-4 py-2 text-white">Post</button>
      </form>
    </div>
  );
}
