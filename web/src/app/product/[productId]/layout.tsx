type ProductLayoutProps = {
  children: React.ReactNode;
};

export default function ProductLayout({ children }: ProductLayoutProps) {
  return <main className="mx-auto flex h-screen max-w-4xl flex-col p-4">{children}</main>;
}
