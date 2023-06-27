import Link from "next/link";

export function Footer() {
  return (
    <footer>
      <div className="container space-y-4 py-10">
        <Link href="/">
          <span className="inline-block font-bold">Awardrobe</span>
        </Link>
        <p className="text-muted-foreground">Built with care</p>
      </div>
    </footer>
  );
}
