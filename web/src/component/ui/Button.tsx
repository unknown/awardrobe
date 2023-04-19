import { cn } from "@/utils/utils";
import { VariantProps, cva } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva("inline-flex items-center justify-center rounded-md transition-colors", {
  variants: {
    variant: {
      primary: "bg-slate-900 text-white hover:bg-slate-800",
      secondary: "bg-slate-100 hover:bg-slate-200",
      outline: "border border-slate-200 hover:bg-slate-100",
    },
    size: {
      sm: "px-2 py-1",
      default: "px-4 py-2",
      lg: "px-8 py-3",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
});

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";
