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

export type SessionNotice = { id: string; reason: "offline" | "missing"; target: "walk" | "dossier" };

export type RestoredSession = {
  selected: string | null;
  notice: SessionNotice | null;
  walking: boolean;
  walkingAs: string | null;
  terminalFull: string | null;
};

/** Resolve each URL-owned state independently against one successful roster snapshot. */
export function restoreSession(pathname: string, search: string, bots: readonly OracleBot[]): RestoredSession {
  const route = parseSessionPath(pathname);
  const selectedLookup = route.kind === "id" ? resolveSession(route.id, bots) : null;
  const selected = selectedLookup?.kind === "live" ? selectedLookup.bot.id : null;
  let notice: SessionNotice | null = selected || route.kind === "none" ? null : {
    target: "dossier",
    id: route.kind === "id" ? route.id : "",
    reason: selectedLookup?.kind === "offline" ? "offline" : "missing",
  };
  const params = new URLSearchParams(search);
  let walking = params.get("walk") === "1";
  const requestedResident = walking ? params.get("as") : null;
  const resident = requestedResident ? resolveSession(requestedResident, bots) : null;
  const walkingAs = resident?.kind === "live" ? resident.bot.id : null;
  if (requestedResident && resident && resident.kind !== "live") {
    notice = { target: "walk", id: requestedResident, reason: resident.kind };
    walking = false;
  }
  const terminalFull = params.get("t") === "1"
    ? params.get("terminal") === "as" ? walkingAs : route.kind === "none" ? walkingAs : selected
    : null;
  return { selected, notice, walking, walkingAs, terminalFull };
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
export function withTerminal(search: string, open: boolean, possessed = false) {
  const params = new URLSearchParams(withFlag(search, "t", open));
  if (open && possessed) params.set("terminal", "as");
  else params.delete("terminal");
  return params.size ? `?${params}` : "";
}

export function withWalking(search: string, walking: boolean, resident: string | null) {
  const params = new URLSearchParams(withFlag(search, "walk", walking));
  if (walking && resident) params.set("as", resident);
  else params.delete("as");
  return params.size ? `?${params}` : "";
}
