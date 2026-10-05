"use client";
import type { HudPanel } from "@/lib/hud";
import { setOffice, useOffice } from "../store";
import { Icon } from "../Icons";
import { toggleMusic } from "../music/music";
import { closeBook, openBook, toggleWalk } from "./hud.shared";

type Item = { id: Exclude<HudPanel, null>; name: string; key: string; icon: "roster" | "notes" | "settings" | "cabinet" };
const ITEMS: Item[] = [{ id: "cabinet", name: "Cabinet", key: "C", icon: "cabinet" }, { id: "residents", name: "Residents", key: "R", icon: "roster" }, { id: "journal", name: "Field notes", key: "J", icon: "notes" }, { id: "settings", name: "Settings", key: "", icon: "settings" }];

export function FieldTools() {
  const panel = useOffice(s => s.hudPanel), walking = useOffice(s => s.walking), music = useOffice(s => s.music);
  return <nav className="field-tools paper" aria-label="Field tools">
    <button id="open-palette" aria-label="Command palette" onClick={() => setOffice({ paletteOpen: true })}><Icon name="search" /><span>Find</span><kbd>⌘K</kbd></button>
    {ITEMS.map(item => <button key={item.id} id={`open-${item.id}`} aria-expanded={panel === item.id} aria-controls={panel === item.id ? "field-book" : undefined} onClick={() => panel === item.id ? closeBook() : openBook(item.id)}><Icon name={item.icon} /><span>{item.name}</span>{item.key && <kbd>{item.key}</kbd>}</button>)}
    <button id="walk-toggle" aria-pressed={walking} aria-label="Walk in the nation as yourself" onClick={toggleWalk}><Icon name="walk" /><span>Walk</span><kbd>H</kbd></button>
    <button id="music-toggle" aria-pressed={music} aria-label="Nation music" onClick={toggleMusic}><Icon name="music" /><span>Music</span><span className="tool-state">{music ? "ON" : "OFF"}</span></button>
  </nav>;
}
