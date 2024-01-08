import { notificationsRouter } from "./router/notifications";
import { productsRouter } from "./router/products";
import { router } from "./trpc";

export const appRouter = router({
  notifications: notificationsRouter,
  products: productsRouter,
});

export type AppRouter = typeof appRouter;
