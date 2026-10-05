"use client";
// Carry out a palette action with the same functions the HUD uses.
import { isThemeId } from "@/lib/themes";
import { setOffice, setPreview, setTheme, useOffice } from "../store";
import { endFootball, matchActive, startFootball } from "../game/football/football.store";
import { toggleMusic } from "../music/music";
import { openBook, toggleWalk, visitZone } from "../hud/hud.shared";
import type { PaletteAction } from "./palette.items";

export function runAction(action: PaletteAction) {
  const state = useOffice.getState();
  setOffice({ paletteOpen: false });
  switch (action.kind) {
    case "follow": setOffice({ selected: action.id, manual: null, hudPanel: null, walking: false }); break;
    case "terminal": setOffice({ selected: action.id, terminalFull: action.id }); break;
    case "visit": visitZone(action.zone); break;
    case "overview": visitZone(); break;
    case "panel": openBook(action.panel); break;
    case "walk": toggleWalk(); break;
    case "football": if (matchActive()) endFootball(); else if (state.bots.length) startFootball(); break;
    case "music": toggleMusic(); break;
    case "theme": if (isThemeId(action.theme)) setTheme(action.theme); break;
    case "map": setOffice({ atlasOpen: !state.atlasOpen, hudPanel: null, selected: null }); break;
    case "clouds": if (!state.preview) setOffice({ terminalEnabled: !state.terminalEnabled }); break;
    case "preview": setPreview(!state.preview); break;
  }
}
