import React from "react";
import { Button, Container, Heading, Section, Text } from "@react-email/components";

import { BaseLayout } from "../components/BaseLayout";
import { formatPrice } from "../utils/currency";

export type StockNotificationEmailProps = {
  productName: string;
  description: string;
  priceInCents: number;
  productUrl: string;
};

export default function StockNotificationEmail({
  productName = "Product Name",
  description = "08 Dark Gray - S",
  priceInCents = 9999,
  productUrl = "https://example.com",
}: StockNotificationEmailProps) {
  const previewText = `${productName} is back in stock!`;

  return (
    <BaseLayout previewText={previewText}>
      <Container className="mx-auto my-10 rounded-xl border border-solid border-[#eaeaea] p-6">
        <Section className="text-left">
          <Heading className="m-0 text-xl font-bold">Awardrobe</Heading>
        </Section>
        <Section className="mt-4 text-center">
          <Heading className="text-2xl font-medium">Back in stock!</Heading>
          <Text className="text-sm">
            {productName} has come back in stock. Here&apos;s another chance for you to snag it.
          </Text>
        </Section>
        <Section className="py-6 text-center">
          <Heading className="my-0 text-xl font-normal">{productName}</Heading>
          <Text className="my-3 text-sm text-[#747474]">{description}</Text>
          <Text className="my-3 text-xl font-bold">{formatPrice(priceInCents)}</Text>
          <Button
            pX={16}
            pY={8}
            className="rounded-md border border-solid border-[#eaeaea] text-center text-sm text-black no-underline"
            href={productUrl}
          >
            View item
          </Button>
        </Section>
      </Container>
    </BaseLayout>
  );
}
