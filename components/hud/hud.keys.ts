"use client";
// Single-key shortcuts for the HUD. Districts (1–0) are handled by the travel deck; ⌘K by the palette.
import { useEffect } from "react";
import { hudShortcut } from "@/lib/hud";
import { setOffice, useOffice } from "../store";
import { endFootball, matchActive, startFootball } from "../game/football/football.store";
import { toggleMusic } from "../music/music";
import { closeBook, openBook, stopWalking, toggleWalk } from "./hud.shared";

export function handleHudKey(event: KeyboardEvent) {
  const state = useOffice.getState();
  if (event.defaultPrevented || state.paletteOpen || state.terminalFull) return; // their own keyboard
  const action = hudShortcut({ key: event.key, ctrlKey: event.ctrlKey, metaKey: event.metaKey, altKey: event.altKey, shiftKey: event.shiftKey, repeat: event.repeat, target: event.target && event.target instanceof HTMLElement ? event.target : null });
  if (action === "open-terminal" || action === "interact") {
    const target = action === "open-terminal" ? state.walkingAs ?? state.selected : state.walkingAs;
    if (target && !state.preview && !(action === "interact" && matchActive())) {
      event.preventDefault();
      setOffice({ terminalFull: target });
    }
    return;
  }
  if (!action || action.startsWith("district:")) return;
  event.preventDefault();
  if (action === "close") { if (state.walkingAs) stopWalking(); else closeBook(); setOffice({ atlasOpen: false, throwMode: false }); }
  if (action === "residents" || action === "journal" || action === "cabinet") state.hudPanel === action ? closeBook() : openBook(action);
  if (action === "map") setOffice({ atlasOpen: !state.atlasOpen, ...(!state.atlasOpen ? { hudPanel: null, selected: null } : {}) });
  if (action === "terminal" && !state.preview) setOffice({ terminalEnabled: !state.terminalEnabled });
  if (action === "walk") toggleWalk();
  if (action === "music") toggleMusic();
  if (action === "football") { if (matchActive()) endFootball(); else if (state.bots.length) startFootball(); }
}

export function useHudKeys() {
  useEffect(() => {
    window.addEventListener("keydown", handleHudKey); return () => window.removeEventListener("keydown", handleHudKey);
  }, []);
}
