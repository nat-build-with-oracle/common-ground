"use client";
// ⌘K / Ctrl+K: find a citizen, open their terminal, go somewhere, or do anything the HUD can do.
import { useEffect, useMemo, useRef, useState } from "react";
import { setOffice, useOffice } from "../store";
import { Icon } from "../Icons";
import { paletteItems, type PaletteItem } from "./palette.items";
import { rank } from "./palette.match";
import { useFootball } from "../game/football/football.store";
import { runAction } from "./palette.run";

export default function CommandPalette({ zones }: { zones: { id: string; name: string }[] }) {
  const open = useOffice(s => s.paletteOpen), bots = useOffice(s => s.bots), preview = useOffice(s => s.preview), walking = useOffice(s => s.walking), music = useOffice(s => s.music);
  const football = useFootball(s => s.match.phase !== "idle");
  const [query, setQuery] = useState(""), [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null), list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOffice({ paletteOpen: !useOffice.getState().paletteOpen }); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { if (open) { setQuery(""); setCursor(0); window.setTimeout(() => input.current?.focus(), 0); } }, [open]);

  const all = useMemo(() => paletteItems({ bots, zones, preview, walking, music, football }), [bots, zones, preview, walking, music, football]);
  const results = useMemo(() => query ? rank(all, query, item => `${item.label} ${item.search}`) : all.filter(item => item.group !== "Citizens" || !item.key.startsWith("terminal:")).slice(0, 40), [all, query]);
  useEffect(() => { list.current?.querySelector(`[data-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" }); }, [cursor]);
  if (!open) return null;

  const choose = (item?: PaletteItem) => { if (item) runAction(item.action); };
  const onKey = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") { event.preventDefault(); setOffice({ paletteOpen: false }); }
    else if (event.key === "ArrowDown") { event.preventDefault(); setCursor(value => Math.min(results.length - 1, value + 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setCursor(value => Math.max(0, value - 1)); }
    else if (event.key === "Enter") { event.preventDefault(); choose(results[cursor]); }
  };
  let group = "";
  return <div className="palette-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setOffice({ paletteOpen: false }); }}>
    <div className="palette paper" role="dialog" aria-modal="true" aria-label="Command palette">
      <label className="palette-input"><Icon name="search" /><input ref={input} value={query} onChange={event => { setQuery(event.target.value); setCursor(0); }} onKeyDown={onKey} placeholder="Find a citizen, a place, or something to do…" aria-label="Search" aria-controls="palette-results" /><kbd>Esc</kbd></label>
      <ul id="palette-results" ref={list} role="listbox">{results.map((item, index) => {
        const heading = item.group !== group ? (group = item.group) : null;
        return <li key={item.key}>{heading && <div className="palette-group">{heading}</div>}<button data-index={index} role="option" aria-selected={index === cursor} className={index === cursor ? "active" : ""} onMouseEnter={() => setCursor(index)} onClick={() => choose(item)}><b>{item.label}</b><small>{item.hint}</small></button></li>;
      })}{!results.length && <li className="palette-empty">Nothing matches “{query}”.</li>}</ul>
      <footer><kbd>↑↓</kbd> choose <kbd>Enter</kbd> go <kbd>⌘K</kbd> toggle</footer>
    </div>
  </div>;
}
