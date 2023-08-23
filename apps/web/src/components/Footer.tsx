import { HTMLAttributes } from "react";

type FooterProps = HTMLAttributes<HTMLElement>;

export function Footer({ className }: FooterProps) {
  return (
    <footer className={className}>
      <div className="container flex items-center justify-center py-8">
        <p className="text-sm">
          Made with care by{" "}
          <a
            className="underline underline-offset-4"
            href="https://dmo.ooo"
            target="_blank"
            rel="noreferrer"
          >
            dmo
          </a>
          . Open source on{" "}
          <a
            className="underline underline-offset-4"
            href="https://github.com/unknown/awardrobe"
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
