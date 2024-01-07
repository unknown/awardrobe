import { authRouter } from "./router/auth";
import { notificationsRouter } from "./router/notifications";
import { router } from "./trpc";

export const appRouter = router({
  auth: authRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
