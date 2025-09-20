import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-md border border-gray-300 p-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black ${className}`}
      {...props}
    />
  )
);
Input.displayName = "Input";

export default Input;


