import { cn } from "@/utils/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn("flex rounded-md border border-gray-200 px-3 py-2", className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
