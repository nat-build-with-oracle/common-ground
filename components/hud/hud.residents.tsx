"use client";
import { useMemo, useState, type CSSProperties } from "react";
import { filterResidents, STATUS_LABEL, type ResidentFilter } from "@/lib/hud";
import { setOffice, setPreview, useOffice } from "../store";
import { Icon } from "../Icons";
import { Book, openBook, selectCitizen, StatusDot } from "./hud.shared";

function EmptyRoster() {
  const sources = useOffice(s => s.sources), loading = useOffice(s => s.loading);
  return <div className="empty-page"><Icon name="roster" /><h3>{loading ? "Listening for residents…" : "A town waiting for its Oracles."}</h3><p>A connected source can be empty. No citizens are invented in live mode.</p>{sources.map(source => <p key={source.id}><b>{source.name} · {source.status}</b><br />{source.error || `${source.count} agents reported`}</p>)}<button className="ink-button" onClick={() => openBook("settings")}>View source setup <span>→</span></button><button className="text-button" onClick={() => setPreview(true)}>Explore a clearly labeled synthetic preview</button></div>;
}

const FILTERS: [ResidentFilter, string][] = [["all", "Everyone"], ["working", "Working"], ["resting", "Idle / done"], ["blocked", "Needs input"], ["unknown", "Unknown"], ["offline", "Offline"]];
export function Residents() {
  const bots = useOffice(s => s.bots), filter = useOffice(s => s.residentFilter);
  const [query, setQuery] = useState("");
  const visible = useMemo(() => filterResidents(bots, filter, query), [bots, filter, query]);
  return <Book title="The residents" index="01"><label className="search-box"><Icon name="search" /><input aria-label="Search residents" placeholder="Name, project, host…" value={query} onChange={event => setQuery(event.target.value)} /></label><div className="resident-filters" role="group" aria-label="Filter residents">{FILTERS.map(([key, label]) => <button key={key} aria-pressed={filter === key} onClick={() => setOffice({ residentFilter: key })}>{label}</button>)}</div><div className="list-count">{visible.length} of {bots.length} residents <span>Choose to follow ↘</span></div><div className="resident-list">{visible.map(bot => <button key={bot.id} className="resident-row" onClick={() => selectCitizen(bot)}><span className="resident-monogram" style={{ "--resident-color": bot.color } as CSSProperties}>{bot.name.slice(0, 1).toUpperCase()}</span><span className="resident-copy"><strong>{bot.name}</strong><small>{bot.project || bot.runtime || "Project not reported"}</small><span><StatusDot status={bot.status} />{STATUS_LABEL[bot.status]}</span></span><span aria-hidden="true">↗</span></button>)}</div>{!bots.length ? <EmptyRoster /> : !visible.length && <div className="empty-page"><h3>No residents match.</h3><p>Try another name or status.</p><button className="text-button" onClick={() => { setQuery(""); setOffice({ residentFilter: "all" }); }}>Clear filters</button></div>}</Book>;
}
