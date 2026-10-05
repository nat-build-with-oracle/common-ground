"use client";
// Match state shared by the scene, the HUD and the palette. Rules are pure (football.rules.ts); this only holds the result.
import { create } from "zustand";
import { setOffice, useOffice } from "../../store";
import { advance, idleMatch, pickTeams, scoreGoal, startMatch, stillFree, type Match, type Roster, type Team } from "./football.rules";

type Football = { match: Match; roster: Roster; charge: number; hint: string };
export const useFootball = create<Football>(() => ({ match: idleMatch(), roster: { home: [], away: [] }, charge: 0, hint: "" }));
export const setFootball = useFootball.setState;
export const matchActive = () => useFootball.getState().match.phase !== "idle";

/** Where the camera should look while a ball is live; the director reads it every frame. */
export const ballCam = { live: false, x: 0, y: 0, z: 0 };

export function startFootball() {
  if (matchActive()) return;
  const { bots } = useOffice.getState();
  setFootball({ match: startMatch(), roster: pickTeams(bots), charge: 0, hint: "" });
  // Watch only: you stand in the match, so walk mode is on and the camera goes to the ball.
  setOffice({ walking: true, selected: null, hudPanel: null, atlasOpen: false, manual: null, manualAt: Date.now(), throwMode: false });
}
export function endFootball() {
  if (!matchActive()) return;
  setFootball({ match: idleMatch(), roster: { home: [], away: [] }, charge: 0, hint: "" });
  ballCam.live = false;
  setOffice({ manual: { kind: "zone", id: "pitch" }, manualAt: Date.now() });
}
export const tickMatch = (dt: number) => setFootball(s => (s.match.phase === "idle" ? s : { match: advance(s.match, dt) }));
export const goalFor = (team: Team) => setFootball(s => ({ match: scoreGoal(s.match, team) }));
export const dropTired = () => setFootball(s => ({ roster: stillFree(s.roster, useOffice.getState().bots) }));
let quiet = 0;
export function hint(text: string) { setFootball({ hint: text }); window.clearTimeout(quiet); quiet = window.setTimeout(() => setFootball({ hint: "" }), 2500); }
