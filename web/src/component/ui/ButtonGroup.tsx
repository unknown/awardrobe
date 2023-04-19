import { cn } from "@/utils/utils";
import { ComponentPropsWithoutRef, forwardRef } from "react";

export type ButtonGroupProps = ComponentPropsWithoutRef<"div">;

export const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "inline-flex rounded-md",
          "[&>*]:rounded-none",
          "[&>*:first-child]:rounded-l-md",
          "[&>*:not(&>*:last-child)]:border-r-0",
          "[&>*:last-child]:rounded-r-md",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
ButtonGroup.displayName = "Button";
