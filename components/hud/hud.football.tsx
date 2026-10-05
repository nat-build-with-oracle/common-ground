"use client";
// The scoreboard: teams, score, clock, goal banner, full-time result and the keys. Always labelled as a simulated match.
import { clockText, result, TEAM_COLORS, TEAM_NAMES } from "../game/football/football.rules";
import { endFootball, useFootball } from "../game/football/football.store";
import { Icon } from "../Icons";

export function FootballBoard() {
  const phase = useFootball(s => s.match.phase), score = useFootball(s => s.match.score), clock = useFootball(s => clockText(s.match.clock));
  const scorer = useFootball(s => s.match.scorer), roster = useFootball(s => s.roster), charge = useFootball(s => s.charge), hint = useFootball(s => s.hint);
  const match = useFootball(s => s.match);
  if (phase === "idle") return null;
  const outcome = result(match);
  return <>
    <section className="scoreboard paper" aria-label="Football scoreboard">
      <div className="score-team"><i style={{ background: TEAM_COLORS[0] }} /><b>{TEAM_NAMES[0]}</b><small>you + {roster.home.length}</small></div>
      <div className="score-mid"><strong>{score[0]} – {score[1]}</strong><span>{phase === "fulltime" ? "FULL TIME" : phase === "kickoff" ? "KICKOFF" : clock}</span></div>
      <div className="score-team"><i style={{ background: TEAM_COLORS[1] }} /><b>{TEAM_NAMES[1]}</b><small>{roster.away.length} citizens</small></div>
      <p>Simulated match · idle &amp; done citizens only · no agent is touched</p>
      <button className="ink-button" onClick={endFootball}><Icon name="close" /> {phase === "fulltime" ? "Close" : "End match"}</button>
    </section>
    {phase === "goal" && scorer !== null && <div className="goal-banner" style={{ background: TEAM_COLORS[scorer] }} role="status">GOAL! {TEAM_NAMES[scorer]}</div>}
    {phase === "fulltime" && <div className="goal-banner full-time" role="status"><small>FULL TIME</small>{outcome.text}</div>}
    <div className="scene-hint football-hint"><Icon name="ball" /> <kbd>W A S D</kbd> move · <kbd>Shift</kbd> sprint · hold <kbd>F</kbd> to kick where you face · <kbd>E</kbd> pass{hint && <b>{hint}</b>}
      {charge > 0 && <span className="charge" aria-hidden="true"><i style={{ width: `${charge * 100}%` }} /></span>}</div>
  </>;
}
