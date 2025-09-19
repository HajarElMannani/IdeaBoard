import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type PropsWithChildren } from "react";

type Variant = "solid" | "outline" | "ghost";
type Tone = "default" | "primary" | "danger";
type Size = "sm" | "md" | "lg";

function mergeButtonClasses(variant: Variant, tone: Tone, size: Size) {
  const base = "inline-flex items-center justify-center rounded font-medium focus:outline-none focus:ring-2 disabled:opacity-50";
  const sizes: Record<Size, string> = {
    sm: "text-xs px-2.5 py-1.5",
    md: "text-sm px-3 py-2",
    lg: "text-sm px-4 py-2.5",
  };
  const tones: Record<Tone, { solid: string; outline: string; ghost: string }> = {
    default: {
      solid: "bg-gray-900 text-white ring-black",
      outline: "border text-gray-800 ring-black",
      ghost: "text-gray-800 ring-black",
    },
    primary: {
      solid: "bg-black text-white ring-black",
      outline: "border border-black text-black ring-black",
      ghost: "text-black ring-black",
    },
    danger: {
      solid: "bg-red-600 text-white ring-red-600",
      outline: "border border-red-600 text-red-700 ring-red-600",
      ghost: "text-red-700 ring-red-600",
    },
  };
  const palette = tones[tone][variant];
  const border = variant === "outline" ? "" : variant === "solid" ? "" : "";
  return `${base} ${sizes[size]} ${palette} ${border}`.trim();
}

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; tone?: Tone; size?: Size }>(function Button(
  { className = "", variant = "outline", tone = "default", size = "md", ...props }, ref
) {
  return (
    <button
      ref={ref}
      className={`${mergeButtonClasses(variant, tone, size)} ${className}`}
      {...props}
    />
  );
});

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = "", ...props }, ref
) {
  return <input ref={ref} className={`w-full rounded border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black ${className}`} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className = "", ...props }, ref
) {
  return <textarea ref={ref} className={`w-full rounded border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black ${className}`} {...props} />;
});

export function Badge({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs text-gray-700 ${className}`}>{children}</span>
  );
}

export function Card({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return <div className={`rounded border bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

export function Modal({ children }: PropsWithChildren) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded bg-white p-4 shadow">{children}</div>
    </div>
  );
}

export function Alert({ children, tone = "default" }: PropsWithChildren<{ tone?: "default" | "danger" }>) {
  const tones = {
    default: "border-gray-200 bg-gray-50 text-gray-800",
    danger: "border-red-200 bg-red-50 text-red-700",
  };
  return <div className={`rounded border p-3 text-sm ${tones[tone]}`}>{children}</div>;
}

export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}


