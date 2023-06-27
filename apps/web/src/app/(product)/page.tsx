import { Fragment } from "react";
import Link from "next/link";
import { Button } from "@ui/Button";

export default async function IndexPage() {
  return (
    <Fragment>
      <section className="py-12">
        <div className="container flex max-w-3xl flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold">Buying clothes made simple</h1>
          <p className="text-muted-foreground">
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
      <section className="space-y-6 bg-slate-50 py-12">
        <div className="container flex max-w-3xl flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-bold">Features</h2>
          <p className="text-muted-foreground">Designed to help you save your time and money.</p>
        </div>
        <div className="container flex max-w-3xl flex-col gap-4">
          <div className="bg-background rounded-md border p-4">
            <h3 className="font-bold">Price tracker</h3>
            <p className="text-muted-foreground">
              Stay informed with price histories and set alerts for price drops and when products
              come back in stock.
            </p>
          </div>
          <div className="bg-background rounded-md border p-4">
            <h3>More coming soon!</h3>
          </div>
        </div>
      </section>
    </Fragment>
  );
}
