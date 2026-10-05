"use client";
// The page: the 3D town at the back, the HUD and overlays in front. Live data starts flowing once it mounts.
import { useEffect } from "react";
import { exposeForTests } from "@/lib/dev-handles";
import Hud from "./Hud";
import Office from "./Office";
import SessionUrl from "./SessionUrl";
import SourceGate from "./source/source.gate";
import { followFleet, loadTheme, useOffice } from "./store";
import TerminalPopup from "./term/term.popup";
import TerminalStreams from "./TerminalStreams";

/** Fetch the terminal (xterm) bundle shortly after the first paint, so the first one you open appears at once. */
function warmTerminal() {
  const timer = window.setTimeout(() => void import("./term/term.xterm"), 2500);
  return () => window.clearTimeout(timer);
}

export default function App() {
  useEffect(() => {
    exposeForTests({ __office: useOffice });
    loadTheme();
    return followFleet();
  }, []);
  useEffect(warmTerminal, []);
  return (
    <main className="app">
      <div className="scene-stage" aria-label="3D Oracle town"><Office /></div>
      <Hud /><TerminalStreams /><TerminalPopup /><SessionUrl /><SourceGate />
    </main>
  );
}
