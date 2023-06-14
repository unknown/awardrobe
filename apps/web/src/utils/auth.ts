import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import EmailProvider from "next-auth/providers/email";

import { prisma } from "@/utils/prisma";

// TODO: hacky fix; track https://github.com/nextauthjs/next-auth/issues/7727
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;
      return Promise.resolve(session);
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
