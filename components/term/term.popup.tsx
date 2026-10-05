"use client";
// Full-screen, read-only terminal for one citizen — the maw-ui (god view) layout without the input side:
// traffic lights, a tab per neighbour, READ ONLY badge. Esc closes, ←/→ steps, 1–9 jumps.
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import type { OracleBot } from "@/lib/fleet-types";
import { STATUS_LABEL } from "@/lib/hud";
import { setOffice, useOffice } from "../store";
import { ago } from "../hud/hud.shared";
import { canWrite } from "../source/source";

const XTerm = dynamic(() => import("./term.xterm"), { ssr: false, loading: () => <p className="xterm-wait">Loading terminal…</p> });
const DOT: Record<string, string> = { working: "#fdd835", blocked: "#f38ba8", idle: "#4caf50", done: "#89b4fa", unknown: "#666", offline: "#333" };
const short = (name: string) => name.replace(/-oracle$/, "").replace(/-/g, " ");
/** The citizen's district neighbours that are online, in a stable order (tabs, ←/→ and 1–9 all use it). */
const neighbours = (bots: OracleBot[], sectionId?: string | null) => bots.filter(other => other.sectionId === sectionId && other.status !== "offline").sort((a, b) => a.name.localeCompare(b.name));

export default function TerminalPopup() {
  const id = useOffice(s => s.terminalFull), bots = useOffice(s => s.bots);
  const bot = bots.find(candidate => candidate.id === id);
  const siblings = useMemo(() => bot ? neighbours(bots, bot.sectionId) : [], [bots, bot]);
  const [state, setState] = useState<{ live: boolean; at: number; error?: string }>({ live: false, at: 0 });
  const writable = useMemo(() => canWrite(), [id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Closing is "back" when the terminal was opened in this tab, so the browser history stays honest.
  const close = () => setOffice({ terminalFull: null });

  useEffect(() => {
    if (!id) return;
    const go = (step: number) => {
      const list = neighbours(useOffice.getState().bots, bot?.sectionId);
      const index = list.findIndex(other => other.id === id), next = list[(index + step + list.length) % list.length];
      if (next) setOffice({ terminalFull: next.id, selected: next.id });
    };
    const onKey = (event: KeyboardEvent) => {
      // Live: keys belong to the agent (Esc interrupts Claude); only Alt+←/→ and Alt+1–9 navigate.
      if (writable && !event.altKey) return;
      if (event.key === "Escape" && !writable) { event.preventDefault(); setOffice({ terminalFull: null }); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
      else if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
      else if (/^[1-9]$/.test(event.key)) {
        event.preventDefault();
        const list = neighbours(useOffice.getState().bots, bot?.sectionId);
        const pick = list[Number(event.key) - 1]; if (pick) setOffice({ terminalFull: pick.id, selected: pick.id });
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [id, bot?.sectionId, writable]);

  if (!id) return null;
  return <div className="term-popup" role="dialog" aria-modal="true" aria-label={`Terminal of ${bot?.name ?? "citizen"}${writable ? ", live" : ", read only"}`}>
    <header className="term-head">
      <div className="term-lights"><button aria-label="Close terminal" onClick={close} /><span /><span /></div>
      <nav className="term-tabs" aria-label="Neighbours">{siblings.map((other, index) => <button key={other.id} className={other.id === id ? "active" : ""} onClick={() => setOffice({ terminalFull: other.id, selected: other.id })} title={`${other.name} · ${STATUS_LABEL[other.status]}`}><i style={{ background: DOT[other.status] ?? "#555" }} />{index < 9 && <small>{index + 1}</small>}{short(other.name)}</button>)}</nav>
      <div className="term-meta"><span className={`term-badge ${state.live ? "live" : ""} ${writable ? "rw" : ""}`}>{writable ? (state.live ? "LIVE · TYPING GOES TO THE AGENT" : `LIVE · ${state.error ?? "connecting"}`) : `READ ONLY · ${state.live ? `captured ${ago(state.at)}` : state.error ?? "connecting"}`}</span><span className="term-host">{bot ? `${bot.host} · ${bot.pane}` : ""}</span>{writable ? <kbd>Alt ←/→</kbd> : <><kbd>←/→</kbd><kbd>Esc</kbd></>}<button className="term-close" aria-label="Close terminal" onClick={close}>✕</button></div>
    </header>
    <div className="term-body"><XTerm key={`${id}:${writable}`} id={id} live={writable} onStatus={setState} /></div>
  </div>;
}
