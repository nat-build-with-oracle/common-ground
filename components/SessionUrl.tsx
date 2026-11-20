"use client";
import { useEffect } from "react";
import { restoreSession, sessionPath, withWalking, withTerminal } from "@/lib/session-url";
import { matchActive } from "./game/football/football.store";
import { setOffice, useOffice } from "./store";

// Keeps the address bar, selected citizen, walking identity and terminal in step.
// Read-only: URL ids are accepted only when they already exist in the connected roster.
function show(delayHuman = false) {
  const state = useOffice.getState();
  const restored = restoreSession(window.location.pathname, window.location.search, state.bots);
  const football = matchActive();
  const walkingAs = football ? null : restored.walkingAs;
  setOffice({
    selected: restored.selected, sessionNotice: restored.notice,
    terminalFull: state.preview || (restored.terminalFull === restored.walkingAs && !walkingAs) ? null : restored.terminalFull,
    walking: football ? state.walking : restored.walking && (!!walkingAs || !delayHuman), walkingAs,
    manual: null, hudPanel: null, ...(restored.walking && !football ? { manualAt: Date.now() } : {}),
  });
  if (restored.walking && !restored.walkingAs && !football && delayHuman) startWalking(3000, !!restored.selected);
}

/** Start walking the way a visitor arrives: a beat of the god view, then the camera flies down to you. */
export function startWalking(delayMs = 3000, preserveSelection = false) {
  const initialPick = useOffice.getState().manualAt;
  window.setTimeout(() => {
    const state = useOffice.getState();
    if (state.walking || state.manualAt !== initialPick) return;
    setOffice({ walking: true, walkingAs: null, ...(!preserveSelection ? { selected: null } : {}), hudPanel: null, atlasOpen: false, manual: null, manualAt: Date.now() });
  }, delayMs);
}

export function followSessionUrl() {
  let ready = false;
  const sync = () => {
    const state = useOffice.getState();
    if (!ready) {
      // A failed request cannot prove that a URL resident is absent. Wait for a successful roster response.
      if (!state.updatedAt) return;
      ready = true;
      return show(true);
    }
    const path = state.selected ? sessionPath(state.selected) : state.sessionNotice ? window.location.pathname : "/";
    const terminalOpen = !!state.terminalFull && (state.terminalFull === state.selected || state.terminalFull === state.walkingAs);
    const possessedPane = path !== "/" && state.terminalFull === state.walkingAs && state.walkingAs !== state.selected;
    const search = withTerminal(window.location.search, terminalOpen, possessedPane);
    const walk = withWalking(search, state.walking, state.walkingAs);
    if (state.selected && state.sessionNotice) return setOffice({ sessionNotice: null });
    // Places and terminals are history steps (back/forward); walking only rewrites the address.
    if (window.location.pathname + withWalking(window.location.search, false, null) !== path + withWalking(search, false, null)) window.history.pushState(null, "", path + walk);
    else if (window.location.pathname + window.location.search !== path + walk) window.history.replaceState(null, "", path + walk);
  };
  const onPop = () => { if (ready) show(); };
  const unsubscribe = useOffice.subscribe(sync);
  window.addEventListener("popstate", onPop);
  sync();
  return () => { unsubscribe(); window.removeEventListener("popstate", onPop); };
}

export default function SessionUrl() {
  useEffect(() => followSessionUrl(), []);
  return null;
}
