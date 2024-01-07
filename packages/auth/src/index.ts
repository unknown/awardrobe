import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import EmailProvider from "next-auth/providers/email";

import { db } from "@awardrobe/db";
import { resend, SignInEmail } from "@awardrobe/emails";

export type { Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const config = {
  adapter: DrizzleAdapter(db),
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
