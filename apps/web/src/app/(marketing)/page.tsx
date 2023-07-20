import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@ui/Button";

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
      <section className="space-y-6 bg-slate-50 py-8 md:py-12 lg:py-24">
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
              <MockChart />
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

const MockChart = () => {
  return (
    <svg
      viewBox="0 0 1000 618"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="#E2E8F0"
      strokeWidth="1"
      shapeRendering="crispEdges"
    >
      <path
        d="M823.703 617V1H999V617H823.703Z"
        fill="url(#linear)"
        stroke="#398739"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M1.99597 617V1H126.497V617H1.99597Z"
        fill="url(#linear)"
        stroke="#398739"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M537.848 617V1H662.349V617H537.848Z"
        fill="url(#linear)"
        stroke="#398739"
        vectorEffect="non-scaling-stroke"
      />
      <path d="M1.99609 1V617" vectorEffect="non-scaling-stroke" />
      <path d="M201.198 1V617" vectorEffect="non-scaling-stroke" />
      <path d="M400.399 1V617" vectorEffect="non-scaling-stroke" />
      <path d="M599.601 1V617" vectorEffect="non-scaling-stroke" />
      <path d="M798.802 1V617" vectorEffect="non-scaling-stroke" />
      <path d="M998.004 1V617" vectorEffect="non-scaling-stroke" />
      <path d="M1 615.773H999" vectorEffect="non-scaling-stroke" />
      <path d="M1 554.418H999" vectorEffect="non-scaling-stroke" />
      <path d="M1 493.063H999" vectorEffect="non-scaling-stroke" />
      <path d="M1 431.709H999" vectorEffect="non-scaling-stroke" />
      <path d="M1 370.354H999" vectorEffect="non-scaling-stroke" />
      <path d="M1 309H999" vectorEffect="non-scaling-stroke" />
      <path d="M1 247.645H999" vectorEffect="non-scaling-stroke" />
      <path d="M1 186.291H999" vectorEffect="non-scaling-stroke" />
      <path d="M1 124.936H999" vectorEffect="non-scaling-stroke" />
      <path d="M1 63.5818H999" vectorEffect="non-scaling-stroke" />
      <path d="M1 2.22705H999" vectorEffect="non-scaling-stroke" />
      <path
        d="M999 388.761H824.123H418.164V229.239H1"
        stroke="#2B8BAD"
        strokeWidth="2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M999 1H1V617H999V1Z"
        stroke="#E2E8F0"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      <defs>
        <linearGradient id="linear" x1="0" y1="1" x2="0" y2="617" gradientUnits="userSpaceOnUse">
          <stop stop-color="#EDFFEA" />
          <stop offset="1" stop-color="#EDFFEA" stop-opacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
  );
};
