import * as React from "react";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full rounded-md border border-gray-300 p-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black ${className}`}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export default Textarea;


