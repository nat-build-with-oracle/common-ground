"use client";
// Small pieces every HUD panel uses: relative time, status dot, opening/closing the field book, toggles.
import { useEffect, useRef, type ReactNode } from "react";
import type { OracleBot, OracleStatus } from "@/lib/fleet-types";
import type { HudPanel, ResidentFilter } from "@/lib/hud";
import { setOffice, useOffice } from "../store";
import { Icon } from "../Icons";
import { sfx } from "../sound";

export function ago(at: number) {
  if (!at) return "not yet";
  const seconds = Math.max(0, Math.round((Date.now() - at) / 1000));
  return seconds < 10 ? "just now" : seconds < 60 ? `${seconds}s ago` : seconds < 3600 ? `${Math.round(seconds / 60)}m ago` : `${Math.round(seconds / 3600)}h ago`;
}
export function safeHref(value: string) { try { const url = new URL(value); return /^(https?:)$/.test(url.protocol) ? url.href : null; } catch { return null; } }
export function StatusDot({ status }: { status: OracleStatus }) { return <span className={`status-dot status-${status}`} aria-hidden="true" />; }
export function selectCitizen(bot: OracleBot) { setOffice({ selected: bot.id, manual: null, hudPanel: null }); sfx("pop"); }
export function openBook(panel: HudPanel, filter: ResidentFilter = "all") { setOffice({ hudPanel: panel, residentFilter: filter, selected: null }); }
export function closeBook() {
  const panel = useOffice.getState().hudPanel;
  setOffice({ hudPanel: null, selected: null });
  document.getElementById(`open-${panel || "residents"}`)?.focus();
}
/** Go to a district, or to the whole nation (no id). Walking: a district fast-travels you there;
 *  the whole nation stops the walk and shows the god view. */
export function visitZone(id?: string) {
  const walking = useOffice.getState().walking;
  if (walking && !id) { setOffice({ walking: false, selected: null, hudPanel: null, manual: { kind: "overview" }, manualAt: Date.now() }); return; }
  setOffice({ hudPanel: null, selected: null, manual: id ? { kind: "zone", id } : { kind: "overview" }, manualAt: Date.now(), ...(walking && id ? { travel: id } : {}) });
}
export function toggleWalk() {
  const walking = !useOffice.getState().walking;
  setOffice({ walking, selected: null, hudPanel: null, atlasOpen: false, manual: walking ? null : { kind: "overview" }, manualAt: Date.now() });
  sfx("pop");
}

export function Book({ title, index, children }: { title: string; index: string; children: ReactNode }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, [title]);
  return <aside className="field-book paper" id="field-book" aria-labelledby="book-title"><div className="book-heading"><div><span className="atlas-kicker">FIELD BOOK / {index}</span><h2 tabIndex={-1} ref={heading} id="book-title">{title}</h2></div><button className="icon-button" onClick={closeBook} aria-label={`Close ${title}`}><Icon name="close" /></button></div><div className="book-content">{children}</div></aside>;
}

export function Toggle({ label, description, checked, disabled, onChange }: { label: string; description: string; checked: boolean; disabled?: boolean; onChange: () => void }) {
  return <label className="setting-row"><span><b>{label}</b><small>{description}</small></span><input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} /><span className="toggle-track" aria-hidden="true" /></label>;
}
