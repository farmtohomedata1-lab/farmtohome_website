"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

// True only once the client has mounted — lets a component defer rendering
// browser-only state (e.g. localStorage-backed values) until it's safe,
// without the extra render an effect+setState guard would cost.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
