import Link from "next/link";
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
  const session = await getServerSession(authOptions);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="container">
        <div className="flex items-center justify-between py-4">
          <NavBar />
          {session ? <ProfileButton /> : <LoginButton />}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

const ProfileButton = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Account</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/api/auth/signout">Sign Out</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const LoginButton = () => {
  return (
    <Link href="/login">
      <Button>Login</Button>
    </Link>
  );
};
