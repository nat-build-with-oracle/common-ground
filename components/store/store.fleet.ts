// Live fleet data: poll the source, keep citizens whose source dropped (shown offline), and announce what changed.
import type { Activity } from "@/lib/hub";
import type { FleetSnapshot } from "@/lib/fleet-types";
import { previewFleet } from "@/lib/fleet";
import { AuthNeeded, loadFleet } from "../source/source";
import { announce } from "./store.events";
import { setOffice, useOffice } from "./store.state";

let controller: AbortController | undefined;
let generation = 0;

export async function refreshFleet() {
  if (useOffice.getState().preview) return;
  controller?.abort();
  controller = new AbortController();
  const request = ++generation;
  setOffice({ loading: true });
  try {
    const snapshot: FleetSnapshot = await loadFleet(controller.signal);
    if (!snapshot.readOnly || !Array.isArray(snapshot.bots) || !Array.isArray(snapshot.sources)) throw new Error("Invalid fleet response");
    if (request !== generation) return;
    const previous = useOffice.getState();
    const failed = new Set(snapshot.sources.filter(s => s.status !== "connected").map(s => s.id));
    const stale = previous.bots.filter(bot => failed.has(bot.source)).map(bot => ({ ...bot, status: "offline" as const, working: false }));
    const bots = [...snapshot.bots, ...stale];
    const sections = [...new Map([...snapshot.sections, ...previous.sections.filter(section => stale.some(bot => bot.sectionId === section.id))].map(section => [section.id, section])).values()];
    const changes: Activity[] = bots.filter(bot => previous.bots.find(old => old.id === bot.id)?.status !== bot.status).map(bot => ({
      botId: bot.id, at: snapshot.updatedAt,
      kind: bot.status === "blocked" ? "ask" : bot.status === "done" ? "done" : "tool",
      emoji: bot.status === "blocked" ? "✋" : "↻", label: `Observed ${bot.status === "blocked" ? "needs input" : bot.status}`,
    }));
    setOffice({
      hostAuth: "ok", ...snapshot, bots, sections, nodes: Array.isArray(snapshot.nodes) ? snapshot.nodes : [], loading: false, error: "", connected: snapshot.sources.some(s => s.status === "connected"),
      feed: [...changes, ...previous.feed].slice(0, 60),
      live: { ...previous.live, ...Object.fromEntries(changes.map(a => [a.botId, a])) },
      selected: bots.some(bot => bot.id === previous.selected) ? previous.selected : null,
    });
    announce(changes);
  } catch (error) {
    if (error instanceof AuthNeeded && request === generation) setOffice({ hostAuth: /refused/.test(error.message) ? "rejected" : "missing" });
    if (request !== generation) return;
    setOffice(state => ({
      loading: false, connected: false, error: error instanceof Error ? error.message : "Could not reach the office server",
      bots: state.bots.map(bot => ({ ...bot, status: "offline", working: false })),
      sources: state.sources.map(source => ({ ...source, status: "offline", error: "Office connection lost" })),
    }));
  }
}

export function setPreview(enabled: boolean) {
  ++generation; controller?.abort();
  setOffice({ terminals: {} });
  if (enabled) {
    setOffice({ ...previewFleet(), preview: true, loading: false, connected: false, error: "", selected: null, live: {}, feed: [], manual: { kind: "overview" }, manualAt: Date.now() });
  } else {
    setOffice({ bots: [], groups: [], sections: [], sources: [], nodes: [], updatedAt: 0, preview: false, selected: null, feed: [], live: {}, loading: true });
    void refreshFleet();
  }
}

/** Poll every 5 s while the tab is visible, and at once when it becomes visible again. Returns the stop function. */
export function followFleet() {
  const poll = () => { if (!document.hidden && !useOffice.getState().preview) void refreshFleet(); };
  void refreshFleet();
  const timer = window.setInterval(poll, 5000);
  document.addEventListener("visibilitychange", poll);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", poll);
    generation += 1; controller?.abort();
  };
}
