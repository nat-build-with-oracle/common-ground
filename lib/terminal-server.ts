import { localServiceUrl } from "./fleet.ts";
import { serviceConfigs } from "./fleet-server.ts";
import type { FleetSnapshot } from "./fleet-types";
import type { TerminalSnapshot } from "./terminal-types";

export { redactTerminal, terminalExcerpt } from "./terminal-text.ts";
import { terminalExcerpt } from "./terminal-text.ts";

export async function readTerminal(botId: string, fleet: FleetSnapshot, configs = serviceConfigs(), fetcher: typeof fetch = fetch): Promise<TerminalSnapshot> {
  const fail = (error: string): TerminalSnapshot => ({ botId, content: "", capturedAt: Date.now(), status: "unavailable", error });
  const bot = fleet.bots.find(bot => bot.id === botId);
  // Never accept a client-supplied target, URL, route, token or command.
  if (!bot || !fleet.sources.some(source => source.id === bot.source && source.status === "connected")) return fail("Agent not in the connected fleet");
  // Remote panes go through the federation's member-gated relay; not captured from the map yet.
  if (bot.source === "federation") return fail("Remote node · terminal not captured from the map");
  const config = configs.find(source => source.id === bot.source);
  if (!config) return fail("Source not configured");
  try {
    const url = new URL("/api/capture", localServiceUrl(config.url));
    url.searchParams.set("target", bot.pane);
    const response = await fetcher(url.toString(), {
      method: "GET", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(3500),
      headers: { accept: "application/json", ...(config.token ? { authorization: `Bearer ${config.token}` } : {}) },
    });
    if (response.status === 401 || response.status === 403) return fail("Source authentication required");
    if (!response.ok) return fail(`Capture unavailable (HTTP ${response.status})`);
    const body = await response.text();
    if (body.length > 2_000_000) return fail("Capture too large");
    const data = JSON.parse(body);
    if (data.error || typeof data.content !== "string") return fail("Source did not provide a terminal capture");
    return { botId, content: terminalExcerpt(data.content), capturedAt: Date.now(), status: "live" };
  } catch {
    return fail("Capture unavailable — source disconnected or timed out");
  }
}
