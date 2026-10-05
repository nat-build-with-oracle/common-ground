"use client";
// On/off for the nation's music. Starts only from a click or key press (browsers require a gesture).
import { setOffice, useOffice } from "../store";
import { startMusic, stopMusic } from "./music.engine";

export function toggleMusic() {
  const on = !useOffice.getState().music;
  setOffice({ music: on });
  if (on) startMusic(); else stopMusic();
}
