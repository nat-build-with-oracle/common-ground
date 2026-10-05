"use client";
// Hosted page only. Without a host or token you land in the synthetic mockup town (walk, play,
// look around) and this small card explains how to connect your own maw herdr serve.
// The token stays in this tab (sessionStorage) and is sent only to that host.
import { useEffect, useState } from "react";
import { refreshFleet, setPreview, useOffice } from "../store";
import { HOSTED, hostChoice, hostToken, setHostToken } from "./source";
import { startWalking } from "../SessionUrl";

const SITE = "https://town.buildwithoracle.com";
const SERVE = `maw herdr serve --token-file ~/.maw-herdr-token --listen 127.0.0.1:3457 --allow-origin ${SITE}`;

export default function SourceGate() {
  const auth = useOffice(s => s.hostAuth), preview = useOffice(s => s.preview), loading = useOffice(s => s.loading);
  const choice = hostChoice(), connected = choice.kind === "host" && auth === "ok" && !preview;
  const [open, setOpen] = useState(true), [hostValue, setHostValue] = useState("http://127.0.0.1:3457"), [token, setToken] = useState("");

  // No host, no token, or a refused token: fall back to the walkable mockup instead of a blocking screen.
  useEffect(() => {
    if (!HOSTED || preview) return;
    const ready = choice.kind === "host" && !!hostToken(choice.origin);
    if (!ready || (!loading && auth !== "ok")) { setPreview(true); startWalking(); }
  }, [auth, preview, loading]); // eslint-disable-line react-hooks/exhaustive-deps
  // A refused token brings the card back open, with the reason in its header.
  useEffect(() => { if (auth === "rejected") setOpen(true); }, [auth]);
  if (!HOSTED || connected) return null;

  const go = (event: React.FormEvent) => { event.preventDefault(); const url = new URL(window.location.href); url.searchParams.set("host", hostValue.trim()); window.location.assign(url.toString()); };
  const connect = (event: React.FormEvent) => {
    event.preventDefault();
    if (choice.kind !== "host" || !token.trim()) return;
    setHostToken(choice.origin, token.trim()); setToken(""); setOpen(false);
    useOffice.setState({ hostAuth: "missing" });
    setPreview(false); void refreshFleet();
  };
  return <div className={`source-gate paper ${open ? "open" : ""}`} role="region" aria-label="Connect your fleet">
    <button className="gate-pill" aria-expanded={open} onClick={() => setOpen(!open)}>
      <span>🏘️ Mockup town</span><b>{auth === "rejected" ? "Token refused · try again" : choice.kind === "host" ? `Connect ${choice.origin.replace(/^https?:\/\//, "")}` : "Connect your fleet"}</b><span aria-hidden="true">{open ? "−" : "+"}</span>
    </button>
    {open && <div className="gate-body">
      <p>You are walking a synthetic town (<kbd>H</kbd> to walk, <kbd>⌘K</kbd> for everything). To see your real agents, your browser reads <b>your own</b> maw herdr serve; nothing passes through this site.</p>
      <ol>
        <li>Start herdr serve and allow this site:<code>{SERVE}</code></li>
        {choice.kind !== "host" ? <li>Open this page with your host:
          <form onSubmit={go}><input aria-label="herdr serve address" value={hostValue} onChange={event => setHostValue(event.target.value)} /><button className="ink-button">Open</button></form>
          {choice.kind === "invalid" && <small className="gate-error">“{choice.value}” is not a bare origin.</small>}</li>
        : <li>Paste the token (<code className="inline">pbcopy &lt; ~/.maw-herdr-token</code>). It stays in this tab and goes only to {choice.origin}. With it, the full-screen terminal can type into agents.
          <form onSubmit={connect}><input type="password" autoComplete="off" aria-label="herdr serve token" value={token} onChange={event => setToken(event.target.value)} placeholder="token" /><button className="ink-button" disabled={!token.trim()}>Connect</button></form></li>}
      </ol>
      <a className="text-button" href="https://github.com/nat-build-with-oracle/oracle-office-town#hosted-townbuildwithoraclecom" target="_blank" rel="noreferrer noopener">Full instructions ↗</a>
    </div>}
  </div>;
}
