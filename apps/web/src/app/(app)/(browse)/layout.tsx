interface HomeLayoutProps {
  children: React.ReactNode;
}

export default async function HomeLayout({ children }: HomeLayoutProps) {
  return <section className="container max-w-4xl space-y-4">{children}</section>;
}
