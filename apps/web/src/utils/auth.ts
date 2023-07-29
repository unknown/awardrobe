import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { render } from "@react-email/render";
import { NextAuthOptions, type DefaultSession } from "next-auth";
import EmailProvider from "next-auth/providers/email";

import { SignInEmail } from "@awardrobe/emails";
import { prisma } from "@awardrobe/prisma-types";

import { resend } from "@/utils/resend";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: { signIn: "/login" },
  providers: [
    EmailProvider({
      sendVerificationRequest: async ({ identifier, url }) => {
        await resend.emails.send({
          to: [identifier],
          from: "Awardrobe <notifications@getawardrobe.com>",
          subject: "Sign in to Awardrobe",
          html: render(SignInEmail({ url })),
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
  secret: process.env.NEXTAUTH_SECRET,
};
