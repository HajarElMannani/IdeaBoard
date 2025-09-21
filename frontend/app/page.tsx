import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="max-w-3xl">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
          Share ideas. Vote together. Improve faster.
        </h1>
        <p className="mt-3 text-sm md:text-base text-gray-600">
          IdeaBoard helps your community propose features, upvote what matters, and discuss improvements.
          Create ideas, vote with a single click, and keep conversations focused.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/auth"><Button variant="solid">Log in / Sign up</Button></Link>
          <Link href="/ideas"><Button>View Ideas</Button></Link>
        </div>
      </div>

      <div className="mt-10 w-full max-w-5xl">
        <Card className="bg-gradient-to-r from-indigo-50 to-cyan-50 border-indigo-100">
          <CardHeader>
            <CardTitle className="text-xl">What you can do</CardTitle>
            <CardDescription>
              Everything you need to collect ideas, prioritize them, and move forward together.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-3 rounded-md bg-white/70 border border-indigo-100">
              <div className="font-medium">Post & discuss</div>
              <div className="text-sm text-gray-600 mt-1">Create ideas, add comments, and keep all the context in one place.</div>
            </div>
            <div className="p-3 rounded-md bg-white/70 border border-indigo-100">
              <div className="font-medium">Vote fairly</div>
              <div className="text-sm text-gray-600 mt-1">Upvote or downvote to surface the best ideas quickly.</div>
            </div>
            <div className="p-3 rounded-md bg-white/70 border border-indigo-100">
              <div className="font-medium">Stay secure</div>
              <div className="text-sm text-gray-600 mt-1">Sign in to keep your activity and preferences protected.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
