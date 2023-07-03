import React from "react";
import { Button, Container, Heading, Section, Text } from "@react-email/components";

import { BaseLayout } from "../components/BaseLayout";

export type SignInEmailProps = {
  url: string;
};

export default function SignInEmail({ url = "https://example.com" }: SignInEmailProps) {
  return (
    <BaseLayout previewText="Sign in to Awardrobe">
      <Container className="mx-auto my-10 rounded-xl border border-solid border-[#eaeaea] p-6">
        <Section className="text-left">
          <Heading className="m-0 text-xl font-bold">Awardrobe</Heading>
        </Section>
        <Section className="mt-4 text-center">
          <Heading className="text-2xl font-medium">Sign in to Awardrobe</Heading>
          <Text className="text-sm">Click the button below to sign in to Awardrobe.</Text>
          <Button
            pX={24}
            pY={12}
            className="rounded-md bg-[#109FEF] text-center text-sm font-medium text-white no-underline"
            href={url}
          >
            Sign in to Awardrobe
          </Button>
          <Text className="text-sm text-[#6E748B]">
            If you didn't make this request, you can safely ignore this email.
          </Text>
        </Section>
      </Container>
    </BaseLayout>
  );
}
