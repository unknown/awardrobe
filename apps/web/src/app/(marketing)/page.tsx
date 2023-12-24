import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@ui/Button";

import { ChartPrice, ProductChart } from "@/components/product/ProductChart";

const mockPrices: ChartPrice[] = [
  {
    date: "2023-07-21T12:00:00.000Z",
    price: 2000,
    stock: 1,
  },
  {
    date: "2023-07-21T12:40:00.000Z",
    price: 2000,
    stock: 0,
  },
  {
    date: "2023-07-21T14:10:00.000Z",
    price: 1500,
    stock: 0,
  },
  {
    date: "2023-07-21T14:50:00.000Z",
    price: 1500,
    stock: 1,
  },
  {
    date: "2023-07-21T15:50:00.000Z",
    price: 1500,
    stock: 0,
  },
  {
    date: "2023-07-21T16:40:00.000Z",
    price: 1500,
    stock: 1,
  },
  {
    date: "2023-07-21T18:00:00.000Z",
    price: 1500,
    stock: 1,
  },
];

export default async function IndexPage() {
  return (
    <Fragment>
      <section className="py-8 md:py-12 lg:py-32">
        <div className="container flex max-w-3xl flex-col items-center gap-6 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">
            Shopping for clothes made simple
          </h1>
          <p className="text-muted-foreground sm:text-lg md:text-xl">
            Track prices and set alerts while building your wardrobe.
          </p>
          <div className="space-x-4">
            <Link href="/browse">
              <Button size="lg">Explore Products</Button>
            </Link>
          </div>
        </div>
      </section>
      <section className="space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
        <div className="container max-w-4xl space-y-8 md:space-y-12">
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-bold sm:text-2xl md:text-3xl lg:text-4xl">How it works</h2>
            <p className="text-muted-foreground sm:text-lg">
              Our tools are designed to save you both your time and your money.
            </p>
          </div>
          <div className="grid grid-cols-1 justify-center gap-8 md:grid-cols-2">
            <div className="bg-background rounded-lg border p-6">
              <h3 className="mb-2 text-xl font-medium md:mb-3">Add products</h3>
              <p className="text-muted-foreground mb-6">
                Find or add products that interest you, and we’ll start tracking the product for
                you.
              </p>
              <Image src="/add-products.png" width="1000" height="576" alt="Multiple screens" />
            </div>
            <div className="bg-background rounded-lg border p-6">
              <h3 className="mb-2 text-xl font-medium md:mb-3">Track prices</h3>
              <p className="text-muted-foreground mb-6">
                See how prices have changed over time to get the best deals.
              </p>
              <div className="relative aspect-video">
                <ProductChart
                  prices={mockPrices}
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                  showAxes={false}
                />
              </div>
            </div>
          </div>
          <p className="text-muted-foreground mb-6 text-center md:text-lg">
            Other tools coming soon!
          </p>
        </div>
      </section>
    </Fragment>
  );
}
