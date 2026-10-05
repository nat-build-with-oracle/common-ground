import { fleetSnapshot, localServiceUrl, mapFederation, mapHerdr, mapMaw } from "./fleet.ts";
import type { FederationNode, FleetProvider, FleetSnapshot, FleetSource, OracleBot } from "./fleet-types";

type Config = { id: FleetProvider; name: string; url: string; token?: string };
export function serviceConfigs(): Config[] {
  return [
    { id: "maw", name: "maw serve", url: process.env.MAW_OFFICE_URL || "http://127.0.0.1:3456", token: process.env.MAW_OFFICE_TOKEN },
    { id: "herdr", name: "maw herdr serve", url: process.env.HERDR_OFFICE_URL || "http://127.0.0.1:3457", token: process.env.HERDR_OFFICE_TOKEN },
    { id: "federation", name: "herdr-federation", url: process.env.FEDERATION_OFFICE_URL || "http://127.0.0.1:6750" },
  ];
}

let lastLocalName: string | undefined;
export async function readFleet(configs = serviceConfigs(), fetcher: typeof fetch = fetch): Promise<FleetSnapshot> {
  const results = await Promise.all(configs.map(async config => {
    const source: FleetSource = { id: config.id, name: config.name, url: "", status: "offline", count: 0, checkedAt: Date.now() };
    let bots: OracleBot[] = [], node = "", nodes: FederationNode[] | undefined;
    try {
      source.url = localServiceUrl(config.url);
      const get = async (path: string) => {
        const response = await fetcher(`${source.url}${path}`, {
          method: "GET", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(8000),
          headers: { accept: "application/json", ...(config.token ? { authorization: `Bearer ${config.token}` } : {}) },
        });
        if (response.status === 401 || response.status === 403) throw new Error(`Authentication required: set ${config.id.toUpperCase()}_OFFICE_TOKEN on the local server`);
        if (!response.ok) throw new Error(`Service returned HTTP ${response.status}`);
        const body = await response.text();
        if (body.length > 2_000_000) throw new Error("Service response is too large");
        return JSON.parse(body) as unknown;
      };
      if (config.id === "maw") {
        const [agents, sessions] = await Promise.all([get("/api/agents"), get("/api/sessions?local=true")]);
        bots = mapMaw(agents, sessions, source.url, source.checkedAt);
      } else if (config.id === "federation") ({ node, bots, nodes } = mapFederation(await get("/api/status"), source.url, source.checkedAt));
      else bots = mapHerdr(await get("/api/sessions"), source.url, source.checkedAt);
      source.status = "connected";
      source.count = bots.length;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Service unavailable";
      source.status = /Authentication|Unexpected|Invalid|missing|HTTP|loopback|JSON|large/i.test(message) ? "error" : "offline";
      source.error = error instanceof Error && error.name === "TimeoutError" ? "Source timed out — last-known agents are resting at home" : source.status === "offline" ? "Service unavailable — check the local daemon and port" : message;
    }
    return { source, bots, node, nodes };
  }));
  // This machine's agents already arrive through `maw herdr serve`; the federation adds the other nodes.
  const herdrLive = results.some(r => r.source.id === "herdr" && r.source.status === "connected");
  const bots = results.flatMap(r => r.source.id === "federation" && herdrLive ? r.bots.filter(bot => bot.host !== r.node) : r.bots);
  for (const r of results) if (r.source.id === "federation" && r.source.status === "connected") r.source.count = bots.filter(bot => bot.source === "federation").length;
  const federation = results.find(r => r.source.id === "federation" && r.source.status === "connected");
  // Keep the machine's name if the federation blinks: renaming the district would rebuild the whole world.
  if (federation?.node) lastLocalName = federation.node;
  return fleetSnapshot(bots, results.map(r => r.source), Date.now(), { localName: lastLocalName, nodes: federation?.nodes });
}

let pending: Promise<FleetSnapshot> | undefined;
let cached: FleetSnapshot | undefined;
export async function cachedFleet() {
  if (cached && Date.now() - cached.updatedAt < 2500) return cached;
  if (!pending) pending = readFleet().then(snapshot => (cached = snapshot)).finally(() => { pending = undefined; });
  return pending;
}
