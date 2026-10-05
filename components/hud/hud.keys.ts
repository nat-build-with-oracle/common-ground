"use client";
// Single-key shortcuts for the HUD. Districts (1–0) are handled by the travel deck; ⌘K by the palette.
import { useEffect } from "react";
import { hudShortcut } from "@/lib/hud";
import { setOffice, useOffice } from "../store";
import { endFootball, matchActive, startFootball } from "../game/football/football.store";
import { toggleMusic } from "../music/music";
import { closeBook, openBook, toggleWalk } from "./hud.shared";

export function useHudKeys() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const state = useOffice.getState();
      if (state.paletteOpen || state.terminalFull) return; // their own keyboard
      const action = hudShortcut({ key: event.key, ctrlKey: event.ctrlKey, metaKey: event.metaKey, altKey: event.altKey, shiftKey: event.shiftKey, repeat: event.repeat, target: event.target instanceof HTMLElement ? event.target : null });
      if (!action && event.key === "Enter" && state.selected && !(event.target instanceof HTMLButtonElement) && !state.preview) { event.preventDefault(); setOffice({ terminalFull: state.selected }); return; }
      if (!action || action.startsWith("district:")) return;
      event.preventDefault();
      if (action === "close") { closeBook(); setOffice({ atlasOpen: false, throwMode: false }); }
      if (action === "residents" || action === "journal" || action === "cabinet") state.hudPanel === action ? closeBook() : openBook(action);
      if (action === "map") setOffice({ atlasOpen: !state.atlasOpen, ...(!state.atlasOpen ? { hudPanel: null, selected: null } : {}) });
      if (action === "terminal" && !state.preview) setOffice({ terminalEnabled: !state.terminalEnabled });
      if (action === "walk") toggleWalk();
      if (action === "music") toggleMusic();
      if (action === "football") { if (matchActive()) endFootball(); else if (state.bots.length) startFootball(); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
}
