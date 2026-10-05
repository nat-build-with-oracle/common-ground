"use client";
import type { CSSProperties } from "react";
import { STATUS_LABEL } from "@/lib/hud";
import { lifeDestination } from "@/lib/life";
import { setOffice, useOffice } from "../store";
import { Icon } from "../Icons";
import { ago, Book, safeHref, StatusDot } from "./hud.shared";

const PLACE = { desk: "At their work desk", waiting: "Petition office", home: "At home / resting", community: "Ministry of Community", drinks: "Café or brewery", garden: "In the garden", parliament: "Sitting in Parliament" } as const;

export function CitizenDossier() {
  const selected = useOffice(s => s.selected), bot = useOffice(s => s.bots.find(candidate => candidate.id === selected));
  const preview = useOffice(s => s.preview), enabled = useOffice(s => s.terminalEnabled), terminal = useOffice(s => selected ? s.terminals[selected] : undefined);
  const routines = useOffice(s => s.routinesEnabled);
  if (!bot) return null;
  const place = PLACE[lifeDestination(bot.status, bot.id, routines ? Date.now() : 0)];
  const href = safeHref(bot.href);
  const fields = [["Project", bot.project || "Not reported"], ["Host / runtime", [bot.host, bot.runtime].filter(Boolean).join(" / ") || "Not reported"], ["Source / pane", `${bot.source} / ${bot.pane || "Not reported"}`]];
  return <Book title="Citizen dossier" index="04">
    <div className="citizen-identity"><span className="resident-monogram" style={{ "--resident-color": bot.color } as CSSProperties}>{bot.name.slice(0, 1).toUpperCase()}</span><div><h3>{bot.name}</h3><p><StatusDot status={bot.status} />{STATUS_LABEL[bot.status]}<span> · {preview ? "synthetic" : `seen ${ago(bot.seenAt)}`}</span></p></div></div>
    <dl className="citizen-facts">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <div className="life-postcard"><span className="atlas-kicker">EVERYDAY LIFE / SIMULATED</span><h3>{place}</h3><p>{bot.project || "Unassigned"} household</p><small>Project-based family. Routines and sleep are visual fiction, not reported activity.</small></div>
    <div className="dossier-terminal"><h3 className="section-label">Terminal / read only</h3>{preview ? <p>No captures in synthetic preview.</p> : !enabled ? <button className="text-button" onClick={() => setOffice({ terminalEnabled: true })}>Show this citizen’s terminal snapshots →</button> : terminal?.status === "live" ? <><span className="capture-stamp">Captured {ago(terminal.capturedAt)}</span><pre className="open-full" title="Open full screen" onClick={() => setOffice({ selected: bot.id, terminalFull: bot.id })}>{terminal.content}</pre></> : <p>{terminal?.error || "Waiting for a local capture…"}</p>}</div>
    {!preview && <button className="ink-button" onClick={() => setOffice({ selected: bot.id, terminalFull: bot.id })}><Icon name="terminal" /> Open full terminal <kbd>Enter</kbd></button>}
    {href && <a className="text-button" href={href} target="_blank" rel="noreferrer noopener">Open source view <Icon name="external" /></a>}
  </Book>;
}
