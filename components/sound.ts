"use client";
// Town sound: synthesized effects (./sound/sound.recipes) and citizens' Thai voices (./sound/sound.voice).
import { useOffice } from "./store";
import { audio, play } from "./sound/sound.synth";
import { RECIPES, type Fx } from "./sound/sound.recipes";
import { localThaiVoice, quiet } from "./sound/sound.voice";

export type { Fx };
export { phrase, speak } from "./sound/sound.voice";

/** Play an effect if town sounds are on. `pan` follows where it happened on screen. */
/** A sound effect, panned from -1 (left) to 1 (right). Silent unless sound is switched on. */
export function sfx(effect: Fx, pan = 0, volume = 1) {
  const on = useOffice.getState().sound;
  if (on) try { play(RECIPES[effect], pan, volume); } catch { /* audio not available yet */ }
}
/** Browsers start audio only after a click or key press. */
export function unlockAudio() { void audio()?.resume(); localThaiVoice(); }
export function hush() { quiet(); }
