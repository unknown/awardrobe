import React from "react";
import { Button, Container, Heading, Section, Text } from "@react-email/components";

import { BaseLayout } from "../components/BaseLayout";

export type DelistedNotificationEmailProps = {
  productName: string;
  storeName: string;
  productUrl: string;
};

export default function DelistedNotificationEmail({
  productName = "Product Name",
  storeName = "Store Name",
  productUrl = "https://example.com",
}: DelistedNotificationEmailProps) {
  const previewText = `${productName} has been delisted`;

  return (
    <BaseLayout previewText={previewText}>
      <Container className="mx-auto my-10 rounded-xl border border-solid border-[#eaeaea] p-6">
        <Section className="text-left">
          <Heading className="m-0 text-xl font-bold">Awardrobe</Heading>
        </Section>
        <Section className="mt-4 text-center">
          <Heading className="text-2xl font-medium">Product delisted</Heading>
          <Text className="text-sm">
            {productName} has been delisted from {storeName}&apos;s online store. We&apos;ll keep an
            eye out for it to come back.
          </Text>
        </Section>
        <Section className="py-6 text-center">
          <Button
            className="rounded-md border border-solid border-[#eaeaea] px-4 py-2 text-center text-sm text-black no-underline"
            href={productUrl}
          >
            View item
          </Button>
        </Section>
      </Container>
    </BaseLayout>
  );
}
