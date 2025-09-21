import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import AuthNav from "@/components/AuthNav";

export const metadata: Metadata = {
  title: "IdeaBoard",
  description: "Community feedback and idea voting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
        <header className="sticky top-0 z-40 bg-indigo-500 text-white shadow">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold text-white">IdeaBoard</Link>
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/ideas" className="text-indigo-50 hover:text-white">Ideas</Link>
              <AuthNav />
            </nav>
          </div>
        </header>
        <main className="py-8 md:py-12">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

 
