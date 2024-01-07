import { cache } from "react";
import { headers } from "next/headers";

import { createCaller, createTRPCContext } from "@awardrobe/api";
import { auth } from "@awardrobe/auth";

const createContext = cache(async () => {
  const heads = new Headers(headers());
  heads.set("x-trpc-source", "rsc");

  return createTRPCContext({
    session: await auth(),
    headers: heads,
  });
});

export const api = createCaller(createContext);
