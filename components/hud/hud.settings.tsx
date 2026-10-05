"use client";
import { THEMES, themeById } from "@/lib/themes";
import { addBall, refreshFleet, setOffice, setPreview, setTheme, useOffice } from "../store";
import { Icon } from "../Icons";
import { hush, sfx, unlockAudio } from "../sound";
import { toggleMusic } from "../music/music";
import { ago, Book, Toggle } from "./hud.shared";

function ThemePicker() {
  const theme = useOffice(s => s.theme);
  return <><h3 className="section-label">Theme</h3><div className="resident-filters theme-picker" role="radiogroup" aria-label="Town theme">{THEMES.map(item => <button key={item.id} role="radio" aria-checked={theme === item.id} aria-pressed={theme === item.id} title={item.blurb} onClick={() => { setTheme(item.id); sfx("pop"); }}>{item.name}</button>)}</div><p className="book-intro">{themeById(theme).blurb}</p></>;
}

export function Settings() {
  const sources = useOffice(s => s.sources), loading = useOffice(s => s.loading), preview = useOffice(s => s.preview);
  const routines = useOffice(s => s.routinesEnabled), music = useOffice(s => s.music);
  const terminalEnabled = useOffice(s => s.terminalEnabled), auto = useOffice(s => s.auto), sound = useOffice(s => s.sound), throwMode = useOffice(s => s.throwMode);
  const rain = () => { for (let i = 0; i < 6; i++) window.setTimeout(() => addBall([(Math.random() - .5) * 6, 9 + i, (Math.random() - .5) * 6], [0, 0, 0]), i * 120); sfx("boing"); };
  return <Book title="Observatory settings" index="03">
    <h3 className="section-label">Source signal</h3><div className="source-cards">{sources.map(source => <div key={source.id}><b><span className={`signal signal-${source.status}`}><i />{source.name}</span><span>{source.status}</span></b><p>{source.error || `${source.count} agents reported · checked ${ago(source.checkedAt)}`}</p></div>)}</div>
    {!sources.length && <p className="book-intro">{preview ? "Preview does not read live sources." : "No source has responded yet."}</p>}
    <button className="ink-button" onClick={() => void refreshFleet()} disabled={loading || preview}><Icon name="refresh" className={loading ? "spin" : ""} />{loading ? "Checking…" : "Refresh live sources"}</button>
    <details className="source-setup"><summary>Local connection setup</summary><code>maw serve --port 3456</code><code>maw herdr serve --listen 127.0.0.1:3457 --token-file PATH</code><code>bunx herdr-federation  # :6750 · join peers to see their agents</code><p>Set URLs and server-only tokens in .env.local. This viewer never sends commands. Enabling writes on the daemon does not enable writes here.</p></details>
    <ThemePicker />
    <h3 className="section-label">The view</h3>
    <Toggle label="Terminal thought clouds" description={preview ? "Unavailable in synthetic preview." : "Read-only snapshots · ~2s · up to 4 citizens."} checked={terminalEnabled && !preview} disabled={preview} onChange={() => setOffice({ terminalEnabled: !terminalEnabled })} />
    <Toggle label="Off-duty wandering" description="Off by default. Optional staggered five-minute routines." checked={routines} onChange={() => setOffice({ routinesEnabled: !routines })} />
    <Toggle label="Follow the work" description="Camera tours working citizens; no agent control." checked={auto} onChange={() => setOffice({ auto: !auto, manual: auto ? { kind: "overview" } : null, manualAt: Date.now(), selected: null })} />
    <h3 className="section-label">Sound</h3>
    <Toggle label="Nation music" description="Generated background music that follows Bangkok's day and night. Off by default." checked={music} onChange={toggleMusic} />
    <Toggle label="Town sounds" description="Local sound effects. Off by default." checked={sound} onChange={() => { sound ? hush() : unlockAudio(); setOffice({ sound: !sound }); }} />
    <h3 className="section-label">Play</h3>
    <Toggle label="Throw a ball" description="Click the ground. Local physics only." checked={throwMode} onChange={() => setOffice({ throwMode: !throwMode })} />
    <button className="text-button" onClick={rain}><Icon name="rain" /> A little ball shower</button>
    <h3 className="section-label">Preview, not pretend</h3><Toggle label="Synthetic town" description="Illustrative residents. Never mixed with live data." checked={preview} onChange={() => setPreview(!preview)} />
    <div className="shortcut-guide"><b>Keyboard field guide</b><p><kbd>⌘K</kbd> Command palette <kbd>C</kbd> Cabinet<br /><kbd>R</kbd> Residents <kbd>J</kbd> Notes <kbd>M</kbd> Map<br /><kbd>T</kbd> Terminals <kbd>H</kbd> Walk <kbd>B</kbd> Music<br /><kbd>1–0</kbd> Travel <kbd>Esc</kbd> Close</p></div>
  </Book>;
}
