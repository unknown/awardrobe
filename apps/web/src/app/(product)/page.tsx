import { Fragment } from "react";
import Link from "next/link";
import { Button } from "@ui/Button";

export default async function IndexPage() {
  return (
    <Fragment>
      <section className="py-10 md:py-24 lg:py-32">
        <div className="container flex max-w-6xl flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">
            Buying clothes made simple
          </h1>
          <p className="text-muted-foreground sm:text-xl">
            Track prices and set alerts while building your wardrobe.
          </p>
          <div className="space-x-4">
            <Link href="/login">
              <Button size="lg">Get started</Button>
            </Link>
            <Link href="/browse">
              <Button size="lg" variant="secondary">
                Explore
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <section className="space-y-6 bg-slate-50 py-8 md:py-12 lg:py-24">
        <div className="container flex max-w-3xl flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">Features</h2>
          <p className="text-muted-foreground sm:text-xl">
            Designed to help you save your time and money.
          </p>
        </div>
        <div className="container grid max-w-6xl gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="bg-background rounded-md border p-6">
            <h3 className="mb-1 font-bold">Price tracker</h3>
            <p className="text-muted-foreground">
              Stay informed with price histories. See how prices have changed over time.
            </p>
          </div>
          <div className="bg-background rounded-md border p-6">
            <h3 className="mb-1 font-bold">Product alerts</h3>
            <p className="text-muted-foreground">
              Set alerts for price drops and when products come back in stock.
            </p>
          </div>
          <div className="bg-background rounded-md border p-6">
            <h3 className="mb-1 font-bold">Product comparisons</h3>
            <p className="text-muted-foreground">Coming soon!</p>
          </div>
          <div className="bg-background rounded-md border p-6">
            <h3 className="mb-1 font-bold">Product reviews</h3>
            <p className="text-muted-foreground">Coming soon!</p>
          </div>
        </div>
      </section>
    </Fragment>
  );
}
