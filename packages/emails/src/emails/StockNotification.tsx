import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import { formatPrice } from "../utils/currency";

export type StockNotificationEmailProps = {
  productName: string;
  productUrl: string;
  priceInCents: number;
};

export default function StockNotificationEmail({
  productName = "Product Name",
  productUrl = "https://example.com",
  priceInCents = 9999,
}: StockNotificationEmailProps) {
  const previewText = `${productName} has restocked`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white font-sans">
          <Container className="mx-auto my-10 w-[465px] rounded p-6">
            <Section className="text-center">
              <Heading className="text-2xl font-medium">Back in stock!</Heading>
              <Text>An item you are tracking has been restocked.</Text>
            </Section>
            <Section className="border border-solid border-[#eaeaea] p-8">
              <Heading className="mt-0 text-lg font-normal">{productName}</Heading>
              <Text className="my-0 text-xl font-medium">{formatPrice(priceInCents)}</Text>
            </Section>
            <Section className="mt-6 text-center">
              <Button
                pX={20}
                pY={12}
                className="rounded bg-[#000000] text-center text-xs font-semibold text-white no-underline"
                href={productUrl}
              >
                View details
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
