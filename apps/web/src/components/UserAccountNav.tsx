import Link from "next/link";
import { User } from "@icons/User";
import { Avatar, AvatarFallback } from "@ui/Avatar";
import { buttonVariants } from "@ui/Button";
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

import { authOptions } from "@/utils/auth";

export async function UserAccountNav() {
  const session = await getServerSession(authOptions);
  return session ? <ProfileButton email={session.user.email ?? null} /> : <LoginButton />;
}

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
    <Link href="/login" className={buttonVariants({ variant: "primary" })}>
      Login
    </Link>
  );
}
