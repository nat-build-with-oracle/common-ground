import type { GroupView } from "./hub";

export type FleetProvider = "maw" | "herdr" | "federation";
export type OracleStatus = "working" | "idle" | "blocked" | "done" | "unknown" | "offline";
/** One agent as a citizen of the town, exactly as a fleet source reported it. Nothing here is invented. */
export type OracleBot = {
  id: string; name: string; color: string;
  /** What runs in the pane: the agent's name, or its command. */ title: string;
  /** The machine or session it works in; its campus in the Ministry of Work. */ sectionId: string | null;
  status: OracleStatus; working: boolean; seenAt: number;
  source: FleetProvider; host: string; runtime: string; pane: string; project: string; href: string;
};
export type FleetSource = {
  id: FleetProvider; name: string; url: string; status: "connected" | "offline" | "error";
  count: number; checkedAt: number; error?: string;
};
/** A machine in the herdr agentic federation, as seen from this node (`self`). */
export type FederationNode = { name: string; ok: boolean; self?: boolean; via?: string; agents: number };
export type FleetSnapshot = {
  bots: OracleBot[]; groups: GroupView[]; sections: { id: string; name: string }[];
  sources: FleetSource[]; updatedAt: number; readOnly: true; nodes?: FederationNode[];
};
