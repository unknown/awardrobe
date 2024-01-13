import { notificationsRouter } from "./router/notifications";
import { productsRouter } from "./router/products";
import { variantsRouter } from "./router/variants";
import { router } from "./trpc";

export const appRouter = router({
  notifications: notificationsRouter,
  products: productsRouter,
  variants: variantsRouter,
});

export type AppRouter = typeof appRouter;
