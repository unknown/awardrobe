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
    <div className="flex min-h-screen flex-col">
      <header className="container">
        <div className="flex h-16 items-center justify-between py-4">
          <NavBar />
          <Suspense>
            <NavBarButton />
          </Suspense>
        </div>
      </header>
      <main className="flex-1">{children}</main>
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