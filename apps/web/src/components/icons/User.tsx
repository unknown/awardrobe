import { forwardRef, SVGProps } from "react";

export const User = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>((props, ref) => {
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
        d="M12 2C9.2385 2 7 4.2385 7 7C7 9.7615 9.2385 12 12 12C14.7615 12 17 9.7615 17 7C17 4.2385 14.7615 2 12 2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 21.5V20C3 17 5 15 8 15H16C19 15 21 17 21 20V21.5"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
});
User.displayName = "User";
