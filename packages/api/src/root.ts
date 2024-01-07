import { authRouter } from "./router/auth";
import { notificationsRouter } from "./router/notifications";
import { productsRouter } from "./router/products";
import { router } from "./trpc";

export const appRouter = router({
  auth: authRouter,
  notifications: notificationsRouter,
  products: productsRouter,
});

export type AppRouter = typeof appRouter;
