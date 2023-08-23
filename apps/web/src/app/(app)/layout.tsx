import { Suspense } from "react";
import Link from "next/link";
import { User } from "@icons/User";
import { Avatar, AvatarFallback } from "@ui/Avatar";
import { Button } from "@ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ui/DropdownMenu";
import { getServerSession } from "next-auth";

import { NavBar } from "@/components/NavBar";
import { authOptions } from "@/utils/auth";

interface ProductLayout {
  children: React.ReactNode;
}

export default async function ProductLayout({ children }: ProductLayout) {
  return (
    <div className="flex min-h-screen flex-col space-y-6">
      <header className="bg-background sticky top-0 z-10 border-b">
        <div className="container flex h-16 items-center justify-between py-4">
          <NavBar homePath="/browse" />
          <Suspense>
            <NavBarButton />
          </Suspense>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-background border-t">
        <div className="container flex items-center justify-center py-8">
          <p className="text-sm">
            Made with care by{" "}
            <a
              className="underline underline-offset-4"
              href="https://dmo.ooo"
              target="_blank"
              rel="noreferrer"
            >
              dmo
            </a>
            . Open source on{" "}
            <a
              className="underline underline-offset-4"
              href="https://github.com/unknown/awardrobe"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}

const NavBarButton = async () => {
  const session = await getServerSession(authOptions);
  return session ? <ProfileButton email={session.user.email ?? null} /> : <LoginButton />;
};

type ProfileButtonProps = { email: string | null };

function ProfileButton({ email }: ProfileButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        {email ? <DropdownMenuLabel>{email}</DropdownMenuLabel> : null}
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/api/auth/signout">Sign Out</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LoginButton() {
  return (
    <Link href="/login">
      <Button>Login</Button>
    </Link>
  );
}
