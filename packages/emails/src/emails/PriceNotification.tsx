import React from "react";
import { Button, Container, Heading, Section, Text } from "@react-email/components";

import { BaseLayout } from "../components/BaseLayout";
import { formatPrice } from "../utils/currency";

export type PriceNotificationEmailProps = {
  productName: string;
  style: string;
  size: string;
  priceInCents: number;
  productUrl: string;
};

export default function PriceNotificationEmail({
  productName = "Product Name",
  style = "08 Dark Gray",
  size = "S",
  priceInCents = 9999,
  productUrl = "https://example.com",
}: PriceNotificationEmailProps) {
  const previewText = `${productName} has dropped in price!`;
  const price = formatPrice(priceInCents);

  return (
    <BaseLayout previewText={previewText}>
      <Container className="mx-auto my-10 rounded-xl border border-solid border-[#eaeaea] p-6">
        <Section className="text-left">
          <Heading className="m-0 text-xl font-bold">Awardrobe</Heading>
        </Section>
        <Section className="mt-4 text-center">
          <Heading className="text-2xl font-medium">Price drop!</Heading>
          <Text className="text-sm">
            {productName} has dropped in price to {price}.
          </Text>
        </Section>
        <Section className="py-6 text-center">
          <Heading className="my-0 text-xl font-normal">{productName}</Heading>
          <Text className="my-3 text-base text-sm text-[#747474]">
            {style} - {size}
          </Text>
          <Text className="my-3 text-xl font-bold">{price}</Text>
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
