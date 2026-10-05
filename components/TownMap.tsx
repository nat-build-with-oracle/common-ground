"use client";
import { useEffect, useState } from "react";
import type { World } from "./world";
import type { Nav } from "./crowd";
import { hudShortcut } from "@/lib/hud";
import { Icon } from "./Icons";
import { setOffice, useOffice } from "./store";
import CommandPalette from "./palette/palette";
import { visitZone } from "./hud/hud.shared";

export default function TownMap({ world, nav }: { world: World; nav: Nav | null }) {
  const bots = useOffice(s => s.bots), manual = useOffice(s => s.manual), selected = useOffice(s => s.selected), open = useOffice(s => s.atlasOpen);
  const panel = useOffice(s => s.hudPanel);
  const [, update] = useState(0);
  useEffect(() => { const timer = setInterval(() => update(value => value + 1), 1000); return () => clearInterval(timer); }, []);
  const work = world.zones.find(zone => ["lab", "support", "exec", "kitchen", "front"].includes(zone.theme));
  const stops = [
    { id: undefined, label: "Whole nation", note: "The big picture", icon: "overview" as const },
    { id: "meeting", label: "Parliament", note: "Sittings & meetings", icon: "parliament" as const },
    { id: "federation", label: "Federation", note: "Every machine", icon: "globe" as const },
    { id: work?.id, label: "Work", note: "Ministry of Work", icon: "work" as const },
    { id: "neighborhood", label: "Home", note: "Prime homes", icon: "home" as const },
    { id: "plaza", label: "Community", note: "Meet in the square", icon: "community" as const },
    { id: "commons", label: "Petitions", note: "Waiting for a human", icon: "waiting" as const },
    { id: "cafe", label: "Café", note: "A drink together", icon: "coffee" as const },
    { id: "brewery", label: "Brewery", note: "Fresh pours", icon: "beer" as const },
    { id: "garden", label: "Garden", note: "Take a breath", icon: "garden" as const },
    { id: "pitch", label: "Sport", note: "Play football", icon: "ball" as const },
  ];
  const visit = (id?: string) => visitZone(id);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const action = hudShortcut({ key: event.key, ctrlKey: event.ctrlKey, metaKey: event.metaKey, altKey: event.altKey, shiftKey: event.shiftKey, repeat: event.repeat, target: event.target instanceof HTMLElement ? event.target : null });
      if (!action?.startsWith("district:")) return;
      const open = useOffice.getState();
      if (open.paletteOpen || open.terminalFull) return; // those overlays own the keyboard
      const stop = stops[Number(action.split(":")[1])];
      if (stop) { event.preventDefault(); visit(stop.id); }
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [world]); // Stops only change when the world layout changes.
  return <>
    <section className={`field-atlas paper ${open ? "is-open" : ""} ${panel || selected ? "is-obscured" : ""}`} aria-label="Town atlas">
      <button className="atlas-fold" id="open-atlas" aria-expanded={open} aria-controls="atlas-map" onClick={() => setOffice({ atlasOpen: !open, ...(!open ? { hudPanel: null, selected: null } : {}) })}><Icon name="map" /><span><b>The field atlas</b><small>{open ? "Fold the map" : "Unfold & explore"}</small></span><kbd>M</kbd><span aria-hidden="true">{open ? "−" : "+"}</span></button>
      {open && <div id="atlas-map" className="atlas-map"><div className="map-north" aria-hidden="true">↑ N</div><svg viewBox={`${-world.w / 2 - 3} ${-world.d / 2 - 3} ${world.w + 6} ${world.d + 6}`} role="group" aria-label="Interactive town districts">
        {world.streets.map((road, i) => <rect key={`r${i}`} x={road.x - road.w / 2} y={road.z - road.d / 2} width={road.w} height={road.d} fill="#bac4b5" />)}
        {world.zones.map(zone => <g key={zone.id} role="button" tabIndex={0} aria-label={`Visit ${zone.name}`} onClick={() => visit(zone.id)} onKeyDown={event => { if (["Enter", " "].includes(event.key)) { event.preventDefault(); visit(zone.id); } }}><rect x={zone.x - zone.w / 2} y={zone.z - zone.d / 2} width={zone.w} height={zone.d} rx={.7} fill={manual?.kind === "zone" && manual.id === zone.id ? "#bd563b" : "#567977"} opacity={.75} stroke="#243e4b" strokeWidth={.2} /><title>{zone.name}</title></g>)}
        {bots.map(bot => { const rt = nav?.rts.get(bot.id); return rt ? <circle key={bot.id} cx={rt.x} cy={rt.z} r={selected === bot.id ? 1.2 : .6} fill={bot.status === "working" ? "#163ea5" : bot.status === "blocked" ? "#a63119" : "#fcf6e5"} stroke="#f6f0df" strokeWidth={.2} /> : null; })}
      </svg><div className="map-legend"><span><i /> Working</span><span><i /> Needs input</span></div><p>{world.households.length} project households <span>Simulated families</span></p></div>}
    </section>
    <nav className="travel-deck paper" aria-label="Travel to a town district"><div className="travel-heading"><span className="atlas-kicker">WHERE TO?</span><span>Choose a district · keys 1–0</span></div><div className="travel-stops">{stops.map((stop, index) => {
      const active = !selected && (stop.id ? manual?.kind === "zone" && manual.id === stop.id : manual?.kind === "overview");
      return <button key={stop.label} className={active ? "active" : ""} aria-pressed={active} onClick={() => visit(stop.id)} title={index < 10 ? `${(index + 1) % 10} · ${stop.note}` : stop.note}><span className="travel-icon"><Icon name={stop.icon} />{index < 10 && <kbd>{(index + 1) % 10}</kbd>}</span><strong>{stop.label}</strong><small>{stop.note}</small></button>;
    })}</div></nav>
    <div className="map-controls-hint">Drag to orbit <span>·</span> Scroll to zoom</div>
    <CommandPalette zones={world.zones} />
  </>;
}
