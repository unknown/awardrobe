import { SVGProps, forwardRef } from "react";

export const Bell = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => {
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
        d="M13.732 20.5a2 2 0 0 1-3.464 0M18 8A6 6 0 1 0 6 8c0 7.5-2 9.5-2 9.5h16s-2-2-2-9.5Z"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
});
Bell.displayName = "Bell";
