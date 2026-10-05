"use client";
import { nextAttention, townCounts } from "@/lib/hud";
import { useOffice } from "../store";
import { selectCitizen } from "./hud.shared";

export function Attention() {
  const bots = useOffice(s => s.bots), selected = useOffice(s => s.selected), preview = useOffice(s => s.preview), sources = useOffice(s => s.sources);
  const count = townCounts(bots).blocked, next = nextAttention(bots, selected);
  const healthy = sources.length > 0 && sources.every(source => source.status === "connected");
  return <section className={`attention-card ${count ? "has-attention" : ""}`} aria-label="Town attention">
    <div className="attention-number" aria-hidden="true">{count ? "!" : "—"}</div><div><span className="atlas-kicker">{preview ? "PREVIEW NOTICE" : "KEEP AN EYE ON"}</span><h2>{count ? `${count} ${count === 1 ? "Oracle needs" : "Oracles need"} input` : "No input requests reported"}</h2><p>{count ? "Find them at the Petition office." : !healthy && !preview ? "Some sources are unavailable. Check the signal." : "Only reported blocked states appear here."}</p><button disabled={!next} onClick={() => next && selectCitizen(next)}>{next ? `Find ${next.name}` : "No one to locate"}<span aria-hidden="true"> →</span></button></div>
  </section>;
}
