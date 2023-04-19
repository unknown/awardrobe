import { cn } from "@/utils/utils";
import { HTMLAttributes, forwardRef } from "react";

export type ButtonGroupProps = HTMLAttributes<HTMLDivElement>;

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex rounded-md",
          "[&>*]:rounded-none [&>*:last-child]:rounded-r-md [&>*:first-child]:rounded-l-md",
          "[&>*:not(&>*:last-child)]:border-r-0",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
ButtonGroup.displayName = "Button";
