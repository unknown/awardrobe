import React from "react";
import { Body, Head, Html, Preview, Tailwind } from "jsx-email";

type BaseLayoutProps = {
  children: React.ReactNode;
  previewText: string;
};

export const BaseLayout = ({ children, previewText }: BaseLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">{children}</Body>
      </Tailwind>
    </Html>
  );
};
