// What each town event sounds like, as layers for sound.synth. Short, soft, and readable at a glance.
import type { Layer } from "./sound.synth";

const tone = (wave: OscillatorType, from: number, to: number | undefined, attack: number, hold: number, release: number, level: number, extra: Partial<Layer> = {}): Layer => ({ kind: "tone", wave, from, to, attack, hold, release, level, ...extra } as Layer);
const hiss = (filter: BiquadFilterType, from: number, to: number | undefined, attack: number, hold: number, release: number, level: number, extra: Partial<Layer> = {}): Layer => ({ kind: "noise", filter, from, to, attack, hold, release, level, ...extra } as Layer);

export const RECIPES = {
  pop: [tone("sine", 620, 980, .004, .02, .09, .35)],
  start: [tone("triangle", 392, undefined, .01, .06, .14, .3), tone("triangle", 523, undefined, .01, .08, .2, .3, { at: .09 })],
  tool: [tone("square", 1250, 1100, .002, .006, .03, .06)],
  type: [hiss("bandpass", 3200, undefined, .001, .004, .012, .12, { q: 4 })],
  say: [tone("triangle", 470, 640, .01, .04, .1, .25)],
  ask: [tone("sine", 740, undefined, .01, .08, .12, .35), tone("sine", 988, undefined, .01, .1, .2, .35, { at: .14 })],
  done: [tone("triangle", 523, undefined, .01, .08, .15, .32), tone("triangle", 659, undefined, .01, .08, .15, .32, { at: .1 }), tone("triangle", 784, undefined, .01, .14, .3, .32, { at: .2 })],
  fail: [tone("sawtooth", 310, 120, .01, .12, .25, .18)],
  boing: [tone("sine", 170, 430, .005, .05, .28, .4, { wobble: 18 })],
  thud: [hiss("lowpass", 160, 70, .002, .02, .12, .5), tone("sine", 95, 55, .002, .02, .1, .35)],
  whoosh: [hiss("bandpass", 400, 1800, .06, .08, .2, .22, { q: 1.4 })],
  whistle: [tone("sine", 2450, undefined, .01, .26, .08, .22, { wobble: 34 })],
  cheer: [hiss("bandpass", 900, 1300, .18, .55, .7, .35, { q: .8 }), hiss("bandpass", 2200, 1800, .25, .45, .6, .18, { q: 1.2 })],
  kick: [tone("sine", 140, 48, .002, .03, .12, .55), hiss("highpass", 1500, undefined, .001, .005, .03, .15)],
} satisfies Record<string, Layer[]>;
export type Fx = keyof typeof RECIPES;
