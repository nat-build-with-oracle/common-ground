"use client";
// The paper HUD over the nation. Each panel lives in ./hud/hud.<panel>.tsx.
import { useEffect, useState } from "react";
import { useOffice } from "./store";
import { Masthead } from "./hud/hud.masthead";
import { Census } from "./hud/hud.census";
import { Attention } from "./hud/hud.attention";
import { FieldTools } from "./hud/hud.tools";
import { Residents } from "./hud/hud.residents";
import { Journal } from "./hud/hud.journal";
import { Settings } from "./hud/hud.settings";
import { Cabinet } from "./hud/hud.cabinet";
import { CitizenDossier } from "./hud/hud.dossier";
import { Overlays } from "./hud/hud.overlays";
import { FootballBoard } from "./hud/hud.football";
import { useHudKeys } from "./hud/hud.keys";

export default function Hud() {
  const panel = useOffice(s => s.hudPanel), selected = useOffice(s => s.selected);
  const [, tick] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => tick(value => value + 1), 5000); return () => window.clearInterval(timer); }, []);
  useHudKeys();
  const book = panel === "residents" ? <Residents /> : panel === "journal" ? <Journal /> : panel === "settings" ? <Settings /> : panel === "cabinet" ? <Cabinet /> : selected ? <CitizenDossier /> : null;
  return <div className={`hud-shell ${panel || selected ? "has-book" : ""}`}><Masthead /><Census /><Attention /><FieldTools />{book}<Overlays /><FootballBoard /></div>;
}
