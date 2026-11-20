"use client";
import { useEffect } from "react";
import { parseSessionPath, restoreSession, sessionPath, withWalking, withTerminal } from "@/lib/session-url";
import { matchActive } from "./game/football/football.store";
import { setOffice, useOffice } from "./store";

let delayedWalk: { timer: number; unsubscribe: () => void; onPop: () => void } | null = null;

function cancelDelayedWalk() {
  if (!delayedWalk) return;
  window.clearTimeout(delayedWalk.timer);
  delayedWalk.unsubscribe();
  window.removeEventListener("popstate", delayedWalk.onPop);
  delayedWalk = null;
}

export function requestedSessionIds(pathname: string, search: string) {
  const route = parseSessionPath(pathname), params = new URLSearchParams(search);
  return [route.kind === "id" ? route.id : null, params.get("walk") === "1" ? params.get("as") : null]
    .filter((id): id is string => !!id);
}

/** A failed source cannot confirm that a requested resident is missing. */
function requestedSourcesReady(state: ReturnType<typeof useOffice.getState>) {
  const { pathname, search } = window.location;
  const requestedIds = requestedSessionIds(pathname, search);
  if (state.preview) return !requestedIds.length || !new URLSearchParams(search).has("host");
  return requestedIds.every(id => {
    const source = id.split(":", 1)[0];
    const report = state.sources.find(candidate => candidate.id === source);
    // A completed roster which does not configure this provider can safely resolve the id as missing.
    return !report || report.status === "connected";
  });
}

// Keeps the address bar, selected citizen, walking identity and terminal in step.
// Read-only: URL ids are accepted only when they already exist in the connected roster.
function show(delayHuman = false) {
  const state = useOffice.getState();
  const restored = restoreSession(window.location.pathname, window.location.search, state.bots);
  const football = matchActive();
  const walkingAs = football ? null : restored.walkingAs;
  setOffice({
    selected: restored.selected, sessionNotice: restored.notice, pendingWalkId: null,
    terminalFull: state.preview || (restored.terminalFull === restored.walkingAs && !walkingAs) ? null : restored.terminalFull,
    terminalInput: null,
    walking: football ? state.walking : restored.walking && (!!walkingAs || !delayHuman), walkingAs,
    manual: null, hudPanel: null, ...(restored.walking && !football ? { manualAt: Date.now() } : {}),
  });
  if (restored.walking && !restored.walkingAs && !football && delayHuman) startWalking(3000, !!restored.selected);
}

/** Start walking the way a visitor arrives: a beat of the god view, then the camera flies down to you. */
export function startWalking(delayMs = 3000, preserveSelection = false) {
  cancelDelayedWalk();
  const initial = useOffice.getState(), initialHref = window.location.href;
  const navigated = (state: typeof initial) => state.walking || state.selected !== initial.selected
    || state.manualAt !== initial.manualAt || state.hudPanel !== initial.hudPanel || state.atlasOpen !== initial.atlasOpen
    || state.paletteOpen !== initial.paletteOpen || state.terminalFull !== initial.terminalFull || window.location.href !== initialHref;
  const onPop = cancelDelayedWalk;
  const unsubscribe = useOffice.subscribe(state => { if (navigated(state)) cancelDelayedWalk(); });
  const timer = window.setTimeout(() => {
    cancelDelayedWalk();
    if (navigated(useOffice.getState())) return;
    setOffice({ walking: true, walkingAs: null, ...(!preserveSelection ? { selected: null } : {}), hudPanel: null, atlasOpen: false, manual: null, manualAt: Date.now() });
  }, delayMs);
  delayedWalk = { timer, unsubscribe, onPop };
  window.addEventListener("popstate", onPop);
}

export function followSessionUrl() {
  let ready = false;
  let picks = useOffice.getState().pickedResidentIds;
  const sync = () => {
    const state = useOffice.getState();
    const picked = picks !== state.pickedResidentIds;
    picks = state.pickedResidentIds;
    if (picked) ready = true;
    if (!ready) {
      // A failed request cannot prove that a URL resident is absent. Wait for a successful roster response.
      if (!state.updatedAt || !requestedSourcesReady(state)) {
        const params = new URLSearchParams(window.location.search);
        const pendingWalkId = params.get("walk") === "1" ? params.get("as") : null;
        if (pendingWalkId !== state.pendingWalkId) setOffice({ pendingWalkId });
        return;
      }
      ready = true;
      return show(true);
    }
    const path = state.selected ? sessionPath(state.selected) : state.sessionNotice?.target === "dossier" ? window.location.pathname : "/";
    const terminalOpen = !!state.terminalFull && (state.terminalFull === state.selected || state.terminalFull === state.walkingAs);
    const possessedPane = path !== "/" && state.terminalFull === state.walkingAs && state.walkingAs !== state.selected;
    const search = withTerminal(window.location.search, terminalOpen, possessedPane);
    const walk = withWalking(search, state.walking, state.walkingAs);
    if (picked && (state.sessionNotice || state.pendingWalkId)) return setOffice({ sessionNotice: null, pendingWalkId: null });
    // Places and terminals are history steps (back/forward); walking only rewrites the address.
    if (window.location.pathname + withWalking(window.location.search, false, null) !== path + withWalking(search, false, null)) window.history.pushState(null, "", path + walk);
    else if (window.location.pathname + window.location.search !== path + walk) window.history.replaceState(null, "", path + walk);
  };
  const onPop = () => {
    cancelDelayedWalk();
    const state = useOffice.getState();
    if (state.updatedAt && requestedSourcesReady(state)) { ready = true; return show(); }
    ready = false;
    setOffice({ terminalFull: null, terminalInput: null });
  };
  const unsubscribe = useOffice.subscribe(sync);
  window.addEventListener("popstate", onPop);
  sync();
  return () => { cancelDelayedWalk(); unsubscribe(); window.removeEventListener("popstate", onPop); };
}

export default function SessionUrl() {
  useEffect(() => followSessionUrl(), []);
  return null;
}
