// Observed activity as it happens. Sound and voice listen here; the journal reads `feed` from the state instead.
import type { Activity } from "@/lib/hub";

type Listener = (activity: Activity) => void;
const listeners = new Set<Listener>();

/** Listen for activity; returns the function that stops listening (fits a React effect's cleanup). */
export function onActivity(listener: Listener) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}
export function announce(activities: Activity[]) {
  for (const activity of activities) for (const listener of listeners) listener(activity);
}
