"use client";
import { useEffect } from "react";
import { flagOn, parseSessionPath, resolveSession, sessionPath, terminalOpen, withFlag, withTerminal } from "@/lib/session-url";
import { setOffice, useOffice } from "./store";

// Keeps the address bar and the selected citizen in step: /s/<fleet id> <-> `selected`.
// Read-only: it only selects an agent that is already in the connected roster.
function show(route: ReturnType<typeof parseSessionPath>) {
  if (route.kind === "none") return setOffice({ selected: null, sessionNotice: null, terminalFull: null });
  const found = route.kind === "id" ? resolveSession(route.id, useOffice.getState().bots) : { kind: "missing" as const };
  if (found.kind === "live") setOffice({ selected: found.bot.id, sessionNotice: null, manual: null, hudPanel: null, terminalFull: terminalOpen(window.location.search) ? found.bot.id : null });
  else setOffice({ selected: null, sessionNotice: { id: route.kind === "id" ? route.id : "", reason: found.kind } });
}

/** Start walking the way a visitor arrives: a beat of the god view, then the camera flies down to you. */
export function startWalking(delayMs = 3000) {
  window.setTimeout(() => {
    if (useOffice.getState().walking) return;
    setOffice({ walking: true, selected: null, hudPanel: null, atlasOpen: false, manual: null, manualAt: Date.now() });
  }, delayMs);
}

export default function SessionUrl() {
  useEffect(() => {
    let ready = false;
    const initial = parseSessionPath(window.location.pathname);
    const sync = () => {
      const state = useOffice.getState();
      if (!ready) {
        // wait for the first roster answer before judging whether the pane exists
        if (state.loading || (!state.updatedAt && !state.error)) return;
        ready = true;
        if (flagOn(window.location.search, "walk") && initial.kind === "none") startWalking();
        return show(initial);
      }
      const path = state.selected ? sessionPath(state.selected) : state.sessionNotice ? window.location.pathname : "/";
      const search = withTerminal(window.location.search, !!state.terminalFull && state.terminalFull === state.selected);
      const walk = withFlag(search, "walk", state.walking);
      if (state.selected && state.sessionNotice) return setOffice({ sessionNotice: null });
      // Places and terminals are history steps (back/forward); walking only rewrites the address.
      if (window.location.pathname + withFlag(window.location.search, "walk", false) !== path + withFlag(search, "walk", false)) window.history.pushState(null, "", path + walk);
      else if (window.location.pathname + window.location.search !== path + walk) window.history.replaceState(null, "", path + walk);
    };
    const onPop = () => { if (ready) show(parseSessionPath(window.location.pathname)); };
    const unsubscribe = useOffice.subscribe(sync);
    window.addEventListener("popstate", onPop);
    sync();
    return () => { unsubscribe(); window.removeEventListener("popstate", onPop); };
  }, []);
  return null;
}
