import type { FederationNode, FleetProvider, FleetSnapshot, FleetSource, OracleBot, OracleStatus } from "./fleet-types";

type Row = Record<string, unknown>;
const row = (value: unknown): Row => value && typeof value === "object" && !Array.isArray(value) ? value as Row : {};
const text = (value: unknown, fallback = "") => typeof value === "string" && value.trim() ? value.trim().slice(0, 200) : fallback;
const colors = ["#71dec0", "#ffb568", "#8eacff", "#df99db", "#b8d880", "#76cdda"];
const colorFor = (id: string) => colors[[...id].reduce((sum, c) => sum + c.charCodeAt(0), 0) % colors.length];
export function normalizeStatus(value: unknown): OracleStatus {
  const status = text(value).toLowerCase();
  if (["working", "active", "running", "busy", "thinking"].includes(status)) return "working";
  if (["blocked", "waiting", "waiting_input", "needs_input"].includes(status)) return "blocked";
  if (["idle", "ready"].includes(status)) return "idle";
  if (["done", "complete"].includes(status)) return "done";
  if (["offline", "disconnected"].includes(status)) return "offline";
  return "unknown"; // Existence or recent output is NOT proof of work/completion.
}

export function localServiceUrl(input: string): string {
  const url = new URL(input);
  if (!["http:", "https:"].includes(url.protocol) || !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)
    || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("Service URL must be a loopback HTTP(S) origin with no credentials or path");
  }
  return url.origin;
}

function sessionsFrom(payload: unknown): Row[] {
  const sessions = Array.isArray(payload) ? payload : row(payload).sessions;
  if (!Array.isArray(sessions)) throw new Error("Unexpected sessions response");
  for (const session of sessions) {
    if (!text(row(session).name) || !Array.isArray(row(session).windows)) throw new Error("Invalid session entry");
  }
  return sessions.map(row);
}

export function projectFromPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  // Group worktrees/subdirectories with their repository, not the task-folder basename.
  const repository = normalized.match(/github\.com\/[^/]+\/([^/]+)/)?.[1];
  return repository || normalized.split("/").filter(Boolean).at(-1) || "Not reported";
}

function makeBot(source: FleetProvider, entry: Row, host: string, url: string, now: number): OracleBot {
  const pane = text(entry.target);
  const id = `${source}:${host}:${pane}`;
  const project = projectFromPath(text(entry.cwd));
  const status = normalizeStatus(entry.status ?? entry.state);
  const reportedName = text(entry.oracle, text(entry.name));
  const generic = !reportedName || /^(claude|codex|opencode|hermes|gemini|w[0-9a-z]+:p[0-9a-z]+)$/i.test(reportedName);
  const name = generic && project !== "Not reported" ? project : reportedName || pane;
  return {
    id, name, title: text(entry.agent, text(entry.command, "Oracle agent")), color: colorFor(id),
    sectionId: `${source}:${host}`, status, working: status === "working",
    source, host, runtime: text(entry.agent, text(entry.command, "Not reported")), pane, project,
    href: url, seenAt: now,
  };
}

export function mapMaw(agentsPayload: unknown, sessionsPayload: unknown, url: string, now: number): OracleBot[] {
  const envelope = row(agentsPayload);
  const agents = Array.isArray(agentsPayload) ? agentsPayload : envelope.agents;
  if (!Array.isArray(agents)) throw new Error("Unexpected MAW agents response");
  const sessions = sessionsFrom(sessionsPayload);
  const windows = new Map<string, Row>();
  for (const session of sessions) for (const raw of session.windows as unknown[]) {
    const window = row(raw);
    windows.set(`${session.name}:${window.index}`, window);
  }
  return agents.map(raw => {
    const agent = row(raw);
    const target = text(agent.target, agent.session !== undefined && agent.window !== undefined ? `${agent.session}:${agent.window}` : text(agent.id));
    if (!target) throw new Error("MAW agent is missing a target");
    const window = windows.get(target) ?? windows.get(target.replace(/\.\d+$/, "")) ?? {};
    return makeBot("maw", {
      ...window, ...agent, target,
      name: text(agent.oracle, text(window.name, text(agent.title, target.split(":")[0]))),
      status: agent.status ?? agent.state ?? window.status,
    }, text(agent.node, text(envelope.node, "local")), url, now);
  });
}

export function mapHerdr(payload: unknown, url: string, now: number): OracleBot[] {
  const bots: OracleBot[] = [];
  for (const session of sessionsFrom(payload)) for (const raw of session.windows as unknown[]) {
    const window = row(raw);
    // Plain shells are not Oracles. The Herdr sessions API supplies agent explicitly.
    if (!text(window.agent)) continue;
    if (typeof window.index !== "number" || !Number.isSafeInteger(window.index) || window.index < 0) throw new Error("Invalid Herdr pane index");
    // Native pane IDs are base36; the HTTP roster/capture target uses decimal indices.
    const target = `${session.name}:${window.index}`;
    bots.push(makeBot("herdr", { ...window, target }, text(session.host, "local"), url, now));
  }
  return bots;
}

/**
 * herdr-federation `GET /api/status`: `node` + `members` (this node) + `peerMembers` (every node it can
 * see, hubs included) + `peers` (health). Agents of a peer whose link is down are shown offline, not live.
 */
export function mapFederation(payload: unknown, url: string, now: number): { node: string; bots: OracleBot[]; nodes: FederationNode[] } {
  const status = row(payload), node = text(status.node);
  if (!node || !Array.isArray(status.members) || (status.peerMembers !== undefined && (typeof status.peerMembers !== "object" || Array.isArray(status.peerMembers)))) throw new Error("Unexpected federation status response");
  const down = new Set((Array.isArray(status.peers) ? status.peers : []).map(row).filter(peer => peer.ok === false).map(peer => text(peer.name)));
  const byNode: [string, unknown[]][] = [[node, status.members], ...Object.entries(row(status.peerMembers)).map(([name, list]) => [name, Array.isArray(list) ? list : []] as [string, unknown[]])];
  const bots: OracleBot[] = [];
  for (const [host, list] of byNode) for (const raw of list) {
    const member = row(raw), pane = text(member.pane), kind = text(member.kind);
    // Plain shells are not Oracles; herdr reports them as kind "shell".
    if (!pane || !kind || kind === "shell") continue;
    bots.push(makeBot("federation", {
      target: pane, name: text(member.handle), agent: kind, cwd: text(member.where),
      status: down.has(host) ? "offline" : member.status,
    }, host, url, now));
  }
  const count = (host: string) => bots.filter(bot => bot.host === host).length;
  const peers = (Array.isArray(status.peers) ? status.peers : []).map(row).filter(peer => text(peer.name));
  const nodes: FederationNode[] = [{ name: node, ok: true, self: true, agents: count(node) }, ...peers.map(peer => ({
    name: text(peer.name), ok: peer.ok !== false, ...(text(peer.via) ? { via: text(peer.via) } : {}), agents: count(text(peer.name)),
  }))];
  return { node, bots, nodes };
}

/** Districts are named after the machine. `localName` is this machine's federation name, when known. */
export function fleetSnapshot(bots: OracleBot[], sources: FleetSource[], now: number, extra: { localName?: string; nodes?: FederationNode[] } = {}): FleetSnapshot {
  const unique = [...new Map(bots.map(bot => [bot.id, bot])).values()].sort((a, b) => a.id.localeCompare(b.id));
  const host = (bot: OracleBot) => bot.host === "local" ? extra.localName ?? "this machine" : bot.host;
  const sections = [...new Map(unique.map(bot => [bot.sectionId!, {
    id: bot.sectionId!, name: `${host(bot)}${bot.source === "maw" ? " · MAW" : ""}`,
  }])).values()];
  return { bots: unique, groups: [], sections, sources, updatedAt: now, readOnly: true, ...(extra.nodes ? { nodes: extra.nodes } : {}) };
}

export function previewFleet(now = Date.now()): FleetSnapshot {
  const names = ["arra-oracle", "glyph-oracle", "dustboy-oracle", "floodboy-oracle", "volt-oracle", "neo-oracle", "athena-oracle", "apollo-oracle", "hermes-oracle"];
  const bots = names.map((name, i) => makeBot(i < 5 ? "maw" : "herdr", {
    name, target: `preview:${i}`, agent: i % 2 ? "Codex" : "Claude", cwd: `/preview/${name}`,
    status: ["working", "working", "idle", "blocked", "idle", "working", "done", "idle", "unknown"][i],
  }, "preview", "", now));
  return fleetSnapshot(bots, [], now, { localName: "preview", nodes: [
    { name: "preview", ok: true, self: true, agents: 9 }, { name: "north", ok: true, agents: 0 }, { name: "south", ok: false, agents: 0 },
  ] });
}
