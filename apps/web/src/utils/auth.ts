import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import EmailProvider from "next-auth/providers/email";

import { resend, SignInEmail } from "@awardrobe/emails";
import { prisma } from "@awardrobe/prisma-types";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const config = {
  adapter: PrismaAdapter(prisma),
  pages: { signIn: "/login" },
  providers: [
    EmailProvider({
      sendVerificationRequest: async ({ identifier, url }) => {
        await resend.emails.send({
          to: [identifier],
          from: "Awardrobe <notifications@getawardrobe.com>",
          subject: "Sign in to Awardrobe",
          react: SignInEmail({ url }),
        });
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      };
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);
