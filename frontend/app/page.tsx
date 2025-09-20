import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="space-y-6 md:space-y-8">
      <Card className="app-card">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">Welcome to IdeaBoard</CardTitle>
          <CardDescription>Collect ideas, vote, and discuss improvements with your community.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Link href="/auth"><Button variant="solid">Log in / Sign up</Button></Link>
          <Link href="/ideas"><Button>View Ideas</Button></Link>
        </CardContent>
      </Card>
    </section>
  );
}
