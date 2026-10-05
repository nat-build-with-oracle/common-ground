"use client";
import { useOffice } from "../store";
import { ago, Book, selectCitizen } from "./hud.shared";

export function Journal() {
  const feed = useOffice(s => s.feed), bots = useOffice(s => s.bots), preview = useOffice(s => s.preview);
  return <Book title="Field notes" index="02"><p className="book-intro">{preview ? "Synthetic preview. No live notes are generated." : "Observed status changes, polled every 5 seconds. Not a complete event log."}</p><ol className="journal-list">{feed.slice(0, 30).map((item, index) => { const bot = bots.find(candidate => candidate.id === item.botId); return <li key={`${item.botId}-${item.at}-${index}`}><time dateTime={new Date(item.at).toISOString()}>{ago(item.at)}</time><button disabled={!bot} onClick={() => bot && selectCitizen(bot)}><b>{bot?.name || "Former resident"}</b><span>{item.label}</span></button></li>; })}</ol>{!feed.length && <div className="empty-page"><h3>A fresh page.</h3><p>{preview ? "Switch back to live sources for observations." : "Notes appear when a source reports a status change."}</p></div>}</Book>;
}
