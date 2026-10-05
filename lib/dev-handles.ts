/** Put handles on `window` for browser checks (store, world, crowd, renderer, physics). Development builds only:
 *  the condition is a compile-time constant, so production bundles drop the whole branch. */
export function exposeForTests(handles: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") Object.assign(window, handles);
}
