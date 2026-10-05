"use client";
import { townCounts, type ResidentFilter } from "@/lib/hud";
import { useOffice } from "../store";
import { ago, openBook } from "./hud.shared";

export function Census() {
  const bots = useOffice(s => s.bots), sources = useOffice(s => s.sources), preview = useOffice(s => s.preview), loading = useOffice(s => s.loading);
  const updatedAt = useOffice(s => s.updatedAt), counts = townCounts(bots);
  const metrics: [ResidentFilter, string, number][] = [["all", "Residents", counts.total], ["working", "At work", counts.working], ["resting", "Idle / done", counts.resting], ["blocked", "Need input", counts.blocked]];
  return <section className="census paper" aria-label={preview ? "Synthetic population" : "Reported population"}>
    <div className="census-heading"><span className="atlas-kicker">{preview ? "ILLUSTRATIVE CENSUS" : "NATIONAL CENSUS"}</span><span>{loading ? "Checking sources…" : preview ? "Not live data" : `Observed ${ago(updatedAt)}`}</span></div>
    <div className="census-metrics">{metrics.map(([filter, label, count]) => <button key={filter} className={`metric metric-${filter}`} onClick={() => openBook("residents", filter)} aria-label={`${label}: ${count}. Open residents`}><strong>{String(count).padStart(2, "0")}</strong><span>{label}</span></button>)}</div>
    <div className="census-signals"><span>{counts.unknown} unknown · {counts.offline} offline</span><button onClick={() => openBook("settings")} aria-label="View source connections">{preview ? "Preview mode" : sources.length ? sources.map(source => <span key={source.id} className={`signal signal-${source.status}`} title={source.error}><i />{source.id} {source.status === "connected" ? source.count : source.status}</span>) : "No source yet"}<span aria-hidden="true"> ↗</span></button></div>
  </section>;
}
