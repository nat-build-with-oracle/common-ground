"use client";
import { useOffice } from "../store";
import { Icon } from "../Icons";

function TownCrest() {
  return <svg className="town-crest" width="56" height="63" viewBox="0 0 64 72" fill="none" aria-hidden="true"><path d="M4 6h56v39c0 12-28 23-28 23S4 57 4 45Z" fill="currentColor" /><path d="M13 38 25 26l12 12M17 35v16h17V35M25 42v9M36 24v27h13V24M32 24l10-9 11 9M40 31h4m-4 7h4M12 55h40" stroke="#f6f0df" strokeWidth="2.3" strokeLinejoin="round" /><circle cx="19" cy="18" r="4" fill="#f6f0df" /></svg>;
}

export function Masthead() {
  const preview = useOffice(s => s.preview);
  return <header className="town-masthead"><TownCrest /><div><div className="atlas-kicker">ARRA <span> / </span> AGENTIC NATION</div><h1>Common Ground<span>✳</span></h1><p>A nation of Oracles: parliament, ministries & everyday life.</p><span className={`truth-seal ${preview ? "is-preview" : ""}`}><Icon name="lock" />{preview ? "SYNTHETIC PREVIEW · READ ONLY" : "LOCAL OBSERVATORY · READ ONLY"}</span></div></header>;
}
