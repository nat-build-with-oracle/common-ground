// The one shared state for the town: what the fleet looks like, who the camera is on, the HUD, and you at play.
import { create } from "zustand";
import type { HudPanel, ResidentFilter } from "@/lib/hud";
import type { Activity, GroupView } from "@/lib/hub";
import type { FederationNode, FleetSource, OracleBot } from "@/lib/fleet-types";
import type { TerminalSnapshot } from "@/lib/terminal-types";
import { DEFAULT_THEME, type ThemeId } from "@/lib/themes";

/** Where the camera was sent by hand: one district, or the whole town. */
export type CameraPick = { kind: "zone"; id: string } | { kind: "overview" };
export type Vec3 = [number, number, number];
/** A thrown ball. Physics owns it after launch; the store only remembers that it exists. */
export type Ball = { id: number; color: string; pos: Vec3; vel: Vec3 };

/** The fleet, as last observed (refreshed by polling). */
type Fleet = {
  bots: OracleBot[]; groups: GroupView[]; sections: { id: string; name: string }[]; sources: FleetSource[]; nodes: FederationNode[];
  updatedAt: number; loading: boolean; preview: boolean; error: string; connected: boolean;
  /** Hosted page: has herdr serve accepted our token? */ hostAuth: "ok" | "missing" | "rejected";
  /** Newest observed activity per citizen, and the journal (newest first). */ live: Record<string, Activity>; feed: Activity[];
  terminals: Record<string, TerminalSnapshot>; terminalEnabled: boolean; routinesEnabled: boolean;
};
/** Who the camera is on, and why. */
type Camera = {
  selected: string | null; hovered: string | null;
  /** The citizen actually in frame: the selected one, or whoever the tour is on. */ focus: string | null;
  /** A pick by hand, and when it was made (a new pick ends the pause after you orbit). */ manual: CameraPick | null; manualAt: number;
  /** Tour the citizens who are working. */ auto: boolean;
  sessionNotice: { id: string; reason: "offline" | "missing" } | null;
};
/** Panels, overlays and switches. */
type Interface = {
  hudPanel: HudPanel; residentFilter: ResidentFilter; atlasOpen: boolean; paletteOpen: boolean;
  /** Full-screen terminal for this citizen id (null = closed). */ terminalFull: string | null;
  theme: ThemeId; sound: boolean; voice: boolean; music: boolean;
  caption: { botId: string; text: string } | null;
};
/** You, walking, and what you throw. */
type Play = {
  walking: boolean; walkHint: string;
  /** Picked a place while walking: fast-travel there (Human handles it, then clears it). */ travel: string | null;
  /** Clicked the ground while walking: go there (Human handles it, then clears it). */ walkTo: { x: number; z: number; run: boolean } | null;
  throwMode: boolean; balls: Ball[];
  /** The last time a ball hit each citizen, and what they said about it. */ hits: Record<string, { at: number; text: string }>;
};
export type State = Fleet & Camera & Interface & Play;

const initialState = (): State => ({
  bots: [], groups: [], sections: [], sources: [], nodes: [], updatedAt: 0, loading: true, preview: false, error: "", connected: false,
  hostAuth: "missing", live: {}, feed: [], terminals: {}, terminalEnabled: true, routinesEnabled: false,
  selected: null, hovered: null, focus: null, manual: { kind: "overview" }, manualAt: Date.now(), auto: false, sessionNotice: null,
  hudPanel: null, residentFilter: "all", atlasOpen: false, paletteOpen: false, terminalFull: null,
  theme: DEFAULT_THEME, sound: false, voice: false, music: false, caption: null,
  walking: false, walkHint: "", travel: null, walkTo: null, throwMode: false, balls: [], hits: {},
});

export const useOffice = create<State>(initialState);
export const setOffice = useOffice.setState;
export const botById = (id: string | null) => id ? useOffice.getState().bots.find(bot => bot.id === id) : undefined;
