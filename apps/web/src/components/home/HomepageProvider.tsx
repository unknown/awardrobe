"use client";

import {
  createContext,
  ReactNode,
  TransitionStartFunction,
  useContext,
  useTransition,
} from "react";

type HomepageContextValue = {
  isPending: boolean;
  startTransition: TransitionStartFunction;
};

export const HomepageContext = createContext<HomepageContextValue>({
  isPending: false,
  startTransition: () => {},
});

type HomepageProviderProps = {
  children: ReactNode;
};

export function HomepageProvider({ children, ...props }: HomepageProviderProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <HomepageContext.Provider value={{ ...props, isPending, startTransition }}>
      {children}
    </HomepageContext.Provider>
  );
}

export function useHomepage() {
  return useContext(HomepageContext);
}
