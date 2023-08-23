import Link from "next/link";

type NavBarProps = {
  homePath?: string;
};

export function NavBar({ homePath = "/" }: NavBarProps) {
  return (
    <div className="flex gap-4">
      <Link href={homePath} className="flex items-center">
        <span className="inline-block font-bold">Awardrobe</span>
      </Link>
    </div>
  );
}
