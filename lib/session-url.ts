import type { OracleBot } from "./fleet-types";

// Per-session deep links: /s/<fleet id>. The id is looked up against the connected
// roster only — the URL can never carry an upstream URL, target or token.
export const SESSION_PREFIX = "/s/";
export const MAX_SESSION_ID = 500; // same bound as /api/terminal

export type SessionRoute = { kind: "none" } | { kind: "invalid" } | { kind: "id"; id: string };
export type SessionLookup = { kind: "live"; bot: OracleBot } | { kind: "offline"; bot: OracleBot } | { kind: "missing" };

// Fleet ids look like `herdr:local:ZGVmYXVsdA/d0Q:34`; ':' and '/' must not shape the path.
export const sessionPath = (id: string) => SESSION_PREFIX + encodeURIComponent(id);

export function parseSessionPath(pathname: string): SessionRoute {
  if (!pathname.startsWith(SESSION_PREFIX)) return { kind: "none" };
  const segments = pathname.slice(SESSION_PREFIX.length).split("/");
  if (segments.at(-1) === "") segments.pop();
  try {
    // Tolerate an unencoded '/' inside the id (catch-all match) by re-joining the segments.
    const id = segments.map(decodeURIComponent).join("/");
    return id && id.length <= MAX_SESSION_ID ? { kind: "id", id } : { kind: "invalid" };
  } catch {
    return { kind: "invalid" };
  }
}

export function resolveSession(id: string, bots: readonly OracleBot[]): SessionLookup {
  const bot = bots.find(candidate => candidate.id === id);
  if (!bot) return { kind: "missing" };
  return bot.status === "offline" ? { kind: "offline", bot } : { kind: "live", bot };
}

/** Flags in the query survive reloads: `t=1` keeps the full-screen terminal open, `walk=1` keeps you walking. */
export type UrlFlag = "t" | "walk";
export const flagOn = (search: string, flag: UrlFlag) => new URLSearchParams(search).get(flag) === "1";
export function withFlag(search: string, flag: UrlFlag, on: boolean) {
  const params = new URLSearchParams(search);
  if (on) params.set(flag, "1"); else params.delete(flag);
  const text = params.toString();
  return text ? `?${text}` : "";
}
export const terminalOpen = (search: string) => flagOn(search, "t");
export const withTerminal = (search: string, open: boolean) => withFlag(search, "t", open);
