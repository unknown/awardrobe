import { getServerSession } from "next-auth";

import { LoginButton, LogoutButton } from "@/components/AuthButtons";
import { NavBar } from "@/components/NavBar";
import { authOptions } from "@/utils/auth";

interface ProductLayout {
  children: React.ReactNode;
}

export default async function ProductLayout({ children }: ProductLayout) {
  const session = await getServerSession(authOptions);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="container">
        <div className="flex items-center justify-between py-4">
          <NavBar />
          {session ? <LogoutButton /> : <LoginButton />}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
