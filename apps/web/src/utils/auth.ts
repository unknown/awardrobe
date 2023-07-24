import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { render } from "@react-email/render";
import { NextAuthOptions, type DefaultSession } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { createTransport } from "nodemailer";

import { SignInEmail } from "@awardrobe/emails";
import { prisma } from "@awardrobe/prisma-types";

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
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const transport = createTransport(provider.server);
        const emailHtml = render(SignInEmail({ url }));
        await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: "Sign in to Awardrobe",
          html: emailHtml,
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
