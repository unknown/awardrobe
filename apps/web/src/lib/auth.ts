import { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "database";
import EmailProvider from "next-auth/providers/email";
import { NextAuthOptions } from "next-auth";

const prisma = new PrismaClient();

// TODO: hacky fix; track https://github.com/nextauthjs/next-auth/issues/7727
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  ],
};
