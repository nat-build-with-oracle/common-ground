// The full visible screen of one citizen's pane, for the full-screen terminal. Read-only, redacted, bounded.
// Local panes come from maw / herdr serve (/api/capture); remote federation panes through the local
// herdr-federation node (/api/fleet/pane), which routes by node.
import { localServiceUrl } from "./fleet.ts";
import { serviceConfigs } from "./fleet-server.ts";
import { fullScreen } from "./terminal-text.ts";
import type { FleetSnapshot } from "./fleet-types";

export type FullTerminal = { botId: string; text: string; capturedAt: number; status: "live" | "unavailable"; error?: string };
export { fullScreen };

export async function readFullTerminal(botId: string, fleet: FleetSnapshot, configs = serviceConfigs(), fetcher: typeof fetch = fetch): Promise<FullTerminal> {
  const fail = (error: string): FullTerminal => ({ botId, text: "", capturedAt: Date.now(), status: "unavailable", error });
  const bot = fleet.bots.find(candidate => candidate.id === botId);
  // Never accept a client-supplied target, URL, route, token or command: only ids of the current fleet.
  if (!bot || !fleet.sources.some(source => source.id === bot.source && source.status === "connected")) return fail("Agent not in the connected fleet");
  const config = configs.find(source => source.id === bot.source);
  if (!config) return fail("Source not configured");
  try {
    const base = localServiceUrl(config.url), headers = { accept: "application/json", ...(config.token ? { authorization: `Bearer ${config.token}` } : {}) };
    const response = bot.source === "federation"
      ? await fetcher(new URL("/api/fleet/pane", base), { method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(4000), headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ node: bot.host, pane: bot.pane, lines: 200 }) })
      : await fetcher(`${base}/api/capture?${new URLSearchParams({ target: bot.pane })}`, { method: "GET", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(4000), headers });
    if (response.status === 401 || response.status === 403) return fail("Source authentication required");
    if (!response.ok) return fail(`Capture unavailable (HTTP ${response.status})`);
    const body = await response.text();
    if (body.length > 2_000_000) return fail("Capture too large");
    const data = JSON.parse(body) as { content?: unknown; text?: unknown; error?: unknown };
    const raw = typeof data.content === "string" ? data.content : typeof data.text === "string" ? data.text : null;
    if (data.error || raw === null) return fail("Source did not provide a terminal capture");
    return { botId, text: fullScreen(raw), capturedAt: Date.now(), status: "live" };
  } catch {
    return fail("Capture unavailable — source disconnected or timed out");
  }
}
