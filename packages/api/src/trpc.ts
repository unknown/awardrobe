import { initTRPC, TRPCError } from "@trpc/server";
import SuperJSON from "superjson";

import { auth, Session } from "@awardrobe/auth";

export const createTRPCContext = async (opts: { session: Session | null; headers: Headers }) => {
  const session = opts.session ?? (await auth());
  const source = opts.headers.get("x-trpc-source") ?? "unknown";

  console.log(`>>> tRPC Request from ${source} by ${session?.user}`);

  return { session };
};

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: SuperJSON,
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
