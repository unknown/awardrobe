import Link from "next/link";

export function NavBar() {
  return (
    <div className="flex gap-4">
      <Link href="/">
        <span className="inline-block h-[40px] font-bold">Awardrobe</span>
      </Link>
    </div>
  );
}
