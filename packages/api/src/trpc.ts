import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import { auth, Session } from "@awardrobe/auth";

export const createTRPCContext = async (opts: { session: Session }) => {
  const session = opts.session ?? (await auth());

  return { session };
};

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
});

export const createCallerFactory = t.createCallerFactory;

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: ctx.session,
    },
  });
});
