import { BrowseNavBar } from "@/components/BrowseNavBar";

interface BrowseLayoutProps {
  children: React.ReactNode;
}

export default async function BrowseLayout({ children }: BrowseLayoutProps) {
  return (
    <section className="container max-w-4xl space-y-4">
      <BrowseNavBar />
      {children}
    </section>
  );
}
