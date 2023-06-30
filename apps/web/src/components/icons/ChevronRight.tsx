import { forwardRef, SVGProps } from "react";

export const ChevronRight = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => {
  return (
    <svg
      width="1.5rem"
      height="1.5rem"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      ref={ref}
      {...props}
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </svg>
  );
});
ChevronRight.displayName = "ChevronRight";
