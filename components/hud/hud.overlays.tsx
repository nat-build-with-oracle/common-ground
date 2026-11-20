"use client";
// Banners and hints over the scene: errors, preview ribbon, captions, walking/throwing hints, the truth line.
import { botById, setOffice, useOffice } from "../store";
import { Icon } from "../Icons";
import { useFootball } from "../game/football/football.store";
import { STATUS_LABEL } from "@/lib/hud";
import { StatusDot } from "./hud.shared";

export function Overlays() {
  const error = useOffice(s => s.error), preview = useOffice(s => s.preview);
  const walking = useOffice(s => s.walking), walkingBot = useOffice(s => s.bots.find(bot => bot.id === s.walkingAs)), walkHint = useOffice(s => s.walkHint), throwMode = useOffice(s => s.throwMode);
  const selectedBot = useOffice(s => s.bots.find(bot => bot.id === s.selected));
  const match = useFootball(s => s.match.phase !== "idle");
  const caption = useOffice(s => s.caption), captionBot = caption ? botById(caption.botId) : null, notice = useOffice(s => s.sessionNotice);
  const switchingBot = selectedBot?.id !== walkingBot?.id ? selectedBot : undefined;
  return <>
    {error && <div role="alert" className="office-error">{error}</div>}
    {notice && <div role="status" className="office-error session-notice">{notice.reason === "offline" ? "This session is offline right now." : "Session not found — it is not in the connected town."} <button className="text-button" onClick={() => { setOffice({ sessionNotice: null }); window.history.pushState(null, "", "/" + window.location.search); }}>Back to the town</button></div>}
    {preview && <div className="preview-ribbon">SYNTHETIC TOWN · no live status or captures</div>}
    {walking && walkingBot && <div className="walking-as-chip" role="status"><StatusDot status={walkingBot.status} /> Walking as <b>{walkingBot.name}</b> · {STATUS_LABEL[walkingBot.status]} · <kbd>Esc</kbd> return to overview</div>}
    {caption && captionBot && <div className="caption"><b>{captionBot.name}</b><span>{caption.text}</span></div>}
    {walking && !match && <div className="scene-hint walk-hint">
      <Icon name="walk" /> <kbd>W A S D</kbd> walk · <kbd>Shift</kbd> run ·
      {walkingBot && !preview
        ? switchingBot
          ? <><kbd>E</kbd> {walkingBot.name} terminal · <kbd>Enter</kbd> {switchingBot.name} terminal</>
          : <><kbd>E</kbd> / <kbd>Enter</kbd> terminal</>
        : <><kbd>E</kbd> say hi</>} ·
      <kbd>F</kbd> throw a ball ·
      {switchingBot ? <><kbd>H</kbd> walk as {switchingBot.name}</> : <><kbd>H</kbd> stop</>}
      {walkHint && <b>{walkHint}</b>}
    </div>}
    {throwMode && <div className="scene-hint"><Icon name="ball" /> Click the ground to throw · Esc to stop</div>}
    <div className="world-truth">{preview ? "All residents and statuses in this preview are synthetic." : "Observed agent status. Imagined everyday life."}<span>Homes, households & routines are simulated.</span></div>
  </>;
}
