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
      <section className="py-12 md:py-40 md:pb-20 lg:py-60 lg:pb-32">
        <div className="container flex max-w-3xl flex-col items-center text-center">
          <div className="flex flex-col gap-6">
            <span className="mx-auto inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium">
              Tracking 5,000+ products
            </span>
            <h1 className="text-3xl font-semibold sm:text-4xl md:text-5xl lg:text-7xl">
              Shop for clothes smarter
            </h1>
            <p className="text-muted-foreground sm:text-lg md:text-xl">
              Research price history and stock availability to save money.
            </p>
          </div>
          <div className="space-x-4 pt-14">
            <Link href="/browse">
              <Button size="lg" className="h-12 px-8 text-sm sm:text-base">
                Get started
              </Button>
            </Link>
          </div>
          <div className="pt-12 md:pt-20 lg:pt-44">
            <div className="w-100 flex max-w-lg flex-wrap justify-center gap-x-12 gap-y-8">
              <p className="text-muted-foreground w-full text-sm sm:text-base">
                Tracking your favorite brands, including
              </p>
              <a href="https://www.uniqlo.com/" target="_blank" rel="noreferrer">
                <Image
                  src="/uniqlo.png"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="h-[36px] w-auto brightness-[0.5] filter transition-all hover:brightness-[0.6]"
                  alt="Uniqlo logo"
                />
              </a>
              <a href="https://www.abercrombie.com/" target="_blank" rel="noreferrer">
                <Image
                  src="/abercrombie.png"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="h-[36px] w-auto brightness-[0.5] filter transition-all hover:brightness-[0.6]"
                  alt="Abercrombie & Fitch logo"
                />
              </a>
              <a href="https://www.jcrew.com/" target="_blank" rel="noreferrer">
                <Image
                  src="/jcrew.png"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="h-[36px] w-auto brightness-[0.5] filter transition-all hover:brightness-[0.6]"
                  alt="J.Crew logo"
                />
              </a>
              <a href="https://www.zara.com/" target="_blank" rel="noreferrer">
                <Image
                  src="/zara.png"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="h-[36px] w-auto brightness-[0.5] filter transition-all hover:brightness-[0.6]"
                  alt="Zara logo"
                />
              </a>
              <a href="https://www.kith.com/" target="_blank" rel="noreferrer">
                <Image
                  src="/kith.png"
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="h-[36px] w-auto brightness-[0.5] filter transition-all hover:brightness-[0.6]"
                  alt="Kith logo"
                />
              </a>
            </div>
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
