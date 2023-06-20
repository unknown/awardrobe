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
import * as React from "react";

import { formatPrice } from "../utils/currency";

export type StockNotificationEmailProps = {
  productName: string;
  productUrl: string;
  priceInCents: number;
};

export const StockNotificationEmail = ({
  productName = "Product Name",
  productUrl = "https://example.com",
  priceInCents = 9999,
}: StockNotificationEmailProps) => {
  const previewText = `${productName} has restocked`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="text-center">
              <Heading className="text-2xl font-medium">Back in stock!</Heading>
              <Text>An item you are tracking has been restocked.</Text>
            </Section>
            <Section className="border border-solid border-[#eaeaea] p-8">
              <Heading className="text-lg font-normal mt-0">{productName}</Heading>
              <Text className="text-xl font-medium my-0">{formatPrice(priceInCents)}</Text>
            </Section>
            <Section className="text-center mt-6">
              <Button
                pX={20}
                pY={12}
                className="bg-[#000000] rounded text-white text-xs font-semibold no-underline text-center"
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
};

export default StockNotificationEmail;
