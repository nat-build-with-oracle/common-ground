"use client";
// Where fleet data comes from. Locally: this app's own /api routes (server holds the tokens).
// On the hosted page (town.buildwithoracle.com): straight from the herdr serve named by ?host=,
// with the operator's token from this tab only. Read-only either way.
import type { FleetSnapshot, OracleBot } from "@/lib/fleet-types";
import type { TerminalSnapshot } from "@/lib/terminal-types";
import { fleetSnapshot, mapHerdr } from "@/lib/fleet";
import { fullScreen, terminalExcerpt } from "@/lib/terminal-text";
import { parseHost, type HostChoice } from "@/lib/hosted";

export const HOSTED = process.env.NEXT_PUBLIC_OFFICE_HOSTED === "1";
export class AuthNeeded extends Error {}

export function hostChoice(): HostChoice { return HOSTED && typeof window !== "undefined" ? parseHost(window.location.search) : { kind: "none" }; }
const key = (origin: string) => `office-town:token:${origin}`;
export function hostToken(origin: string) { try { return sessionStorage.getItem(key(origin)) ?? ""; } catch { return ""; } }
export function setHostToken(origin: string, token: string) { try { if (token) sessionStorage.setItem(key(origin), token); else sessionStorage.removeItem(key(origin)); } catch { /* storage blocked */ } }

async function hostGet(origin: string, path: string, signal?: AbortSignal): Promise<unknown> {
  const token = hostToken(origin);
  if (!token) throw new AuthNeeded("Paste your herdr serve token to connect");
  const response = await fetch(origin + path, { headers: { authorization: `Bearer ${token}`, accept: "application/json" }, cache: "no-store", credentials: "omit", signal });
  if (response.status === 401 || response.status === 403) throw new AuthNeeded("herdr serve refused the token");
  if (!response.ok) throw new Error(`herdr serve returned HTTP ${response.status}`);
  return response.json();
}
function host(): string {
  const choice = hostChoice();
  if (choice.kind === "host") return choice.origin;
  throw new Error(choice.kind === "invalid" ? "?host= must be a bare origin, like http://127.0.0.1:3457" : "Add ?host= with your herdr serve, like ?host=http://127.0.0.1:3457");
}

export async function loadFleet(signal?: AbortSignal): Promise<FleetSnapshot> {
  if (!HOSTED) {
    const response = await fetch("/api/fleet", { cache: "no-store", signal });
    if (!response.ok) throw new Error(`Fleet endpoint returned HTTP ${response.status}`);
    return response.json();
  }
  const origin = host(), now = Date.now();
  const bots = mapHerdr(await hostGet(origin, "/api/sessions", signal), origin, now);
  return fleetSnapshot(bots, [{ id: "herdr", name: "maw herdr serve", url: origin, status: "connected", count: bots.length, checkedAt: now }], now);
}

async function capture(bot: OracleBot, signal?: AbortSignal) {
  const data = await hostGet(host(), `/api/capture?${new URLSearchParams({ target: bot.pane })}`, signal) as { content?: unknown };
  if (typeof data.content !== "string") throw new Error("herdr serve did not return a capture");
  return data.content;
}

/** Thought clouds: the last lines of up to four citizens. */
export async function loadClouds(ids: string[], bots: OracleBot[], signal?: AbortSignal): Promise<TerminalSnapshot[]> {
  if (!HOSTED) {
    const query = new URLSearchParams(); ids.forEach(id => query.append("id", id));
    const response = await fetch(`/api/terminal?${query}`, { cache: "no-store", signal });
    if (!response.ok) throw new Error(`Terminal endpoint HTTP ${response.status}`);
    return (await response.json() as { snapshots: TerminalSnapshot[] }).snapshots;
  }
  return Promise.all(ids.map(async botId => {
    const bot = bots.find(candidate => candidate.id === botId);
    try {
      if (!bot) throw new Error("Agent not in the connected fleet");
      return { botId, content: terminalExcerpt(await capture(bot, signal)), capturedAt: Date.now(), status: "live" as const };
    } catch (error) { return { botId, content: "", capturedAt: Date.now(), status: "unavailable" as const, error: error instanceof Error ? error.message : "Capture unavailable" }; }
  }));
}

/** The full-screen terminal: one citizen's whole visible screen. */
export async function loadFull(id: string, bots: OracleBot[], signal?: AbortSignal): Promise<{ text: string; status: "live" | "unavailable"; error?: string; capturedAt: number }> {
  if (!HOSTED) return (await fetch(`/api/terminal/full?${new URLSearchParams({ id })}`, { cache: "no-store", signal })).json();
  const bot = bots.find(candidate => candidate.id === id);
  try {
    if (!bot) throw new Error("Agent not in the connected fleet");
    return { text: fullScreen(await capture(bot, signal)), status: "live", capturedAt: Date.now() };
  } catch (error) { return { text: "", status: "unavailable", error: error instanceof Error ? error.message : "Capture unavailable", capturedAt: Date.now() }; }
}

/** Hosted page with a token: the full-screen terminal may type into the agent. */
export function canWrite(): boolean { const choice = hostChoice(); return choice.kind === "host" && !!hostToken(choice.origin); }

/** A live terminal for one pane (herdr serve /ws/pty): ticket first (single use, 30 s), then the socket. */
export async function openPty(bot: OracleBot, signal?: AbortSignal): Promise<WebSocket> {
  const origin = host(), token = hostToken(origin);
  if (!token) throw new AuthNeeded("Paste your herdr serve token to connect");
  const response = await fetch(`${origin}/api/auth/ws-ticket`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ path: "/ws/pty" }), credentials: "omit", signal });
  if (response.status === 401 || response.status === 403) throw new AuthNeeded("herdr serve refused the token");
  const data = await response.json() as { protocol?: string; ticket?: string };
  if (!response.ok || !data.ticket) throw new Error(`No terminal ticket (HTTP ${response.status})`);
  const socket = new WebSocket(origin.replace(/^http/, "ws") + "/ws/pty", [data.protocol ?? "maw.ws.v1", data.ticket]);
  socket.binaryType = "arraybuffer";
  return socket;
}
