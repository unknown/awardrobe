import Link from "next/link";
import { Button } from "@ui/Button";

export default function ProductNotFoundPage() {
  return (
    <section className="container max-w-4xl space-y-2">
      <h1 className="text-2xl font-medium">Product not found</h1>
      <p>The product you&apos;re looking couldn&apos;t be found</p>
      <div>
        <Link href="/">
          <Button>Go home</Button>
        </Link>
      </div>
    </section>
  );
}
