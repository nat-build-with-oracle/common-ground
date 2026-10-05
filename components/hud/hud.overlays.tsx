"use client";
// Banners and hints over the scene: errors, preview ribbon, captions, walking/throwing hints, the truth line.
import { botById, setOffice, useOffice } from "../store";
import { Icon } from "../Icons";
import { useFootball } from "../game/football/football.store";

export function Overlays() {
  const error = useOffice(s => s.error), preview = useOffice(s => s.preview);
  const walking = useOffice(s => s.walking), walkHint = useOffice(s => s.walkHint), throwMode = useOffice(s => s.throwMode);
  const match = useFootball(s => s.match.phase !== "idle");
  const caption = useOffice(s => s.caption), captionBot = caption ? botById(caption.botId) : null, notice = useOffice(s => s.sessionNotice);
  return <>
    {error && <div role="alert" className="office-error">{error}</div>}
    {notice && <div role="status" className="office-error session-notice">{notice.reason === "offline" ? "This session is offline right now." : "Session not found — it is not in the connected town."} <button className="text-button" onClick={() => { setOffice({ sessionNotice: null }); window.history.pushState(null, "", "/" + window.location.search); }}>Back to the town</button></div>}
    {preview && <div className="preview-ribbon">SYNTHETIC TOWN · no live status or captures</div>}
    {caption && captionBot && <div className="caption"><b>{captionBot.name}</b><span>{caption.text}</span></div>}
    {walking && !match && <div className="scene-hint walk-hint"><Icon name="walk" /> <kbd>W A S D</kbd> walk · <kbd>Shift</kbd> run · <kbd>E</kbd> say hi · <kbd>F</kbd> throw a ball · <kbd>H</kbd> stop{walkHint && <b>{walkHint}</b>}</div>}
    {throwMode && <div className="scene-hint"><Icon name="ball" /> Click the ground to throw · Esc to stop</div>}
    <div className="world-truth">{preview ? "All residents and statuses in this preview are synthetic." : "Observed agent status. Imagined everyday life."}<span>Homes, households & routines are simulated.</span></div>
  </>;
}
