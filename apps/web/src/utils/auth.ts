import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { render } from "@react-email/render";
import { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { createTransport } from "nodemailer";

import { SignInEmail } from "@awardrobe/emails";
import { prisma } from "@awardrobe/prisma-types";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/login",
  },
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const transport = createTransport(provider.server);
        const emailHtml = render(SignInEmail({ url }));
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: "Sign in to Awardrobe",
          html: emailHtml,
        });

        const failed = result.rejected.concat(result.pending).filter(Boolean);
        if (failed.length) {
          throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
        }
      },
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
