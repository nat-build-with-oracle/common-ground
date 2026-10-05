"use client";
// Web Audio for the nation's music: pad chords through a low-pass and reverb, a plucked arpeggio
// through a delay, a soft bass on each bar and brushed hats by day. Scheduled a little ahead of time.
import { bangkokHour } from "../store";
import { arpeggio, chordNotes, eighth, midiToHz, moodFor, type Mood } from "./music.score";

type Engine = { ctx: AudioContext; master: GainNode; pad: BiquadFilterNode; echo: GainNode; reverb: ConvolverNode; timer: number; step: number; bar: number; at: number; mood: Mood; pattern: (number | null)[] };
let engine: Engine | null = null;

function impulse(ctx: AudioContext, seconds: number) {
  const length = Math.floor(ctx.sampleRate * seconds), buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) { const data = buffer.getChannelData(channel); for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6); }
  return buffer;
}

function voice(e: Engine, type: OscillatorType, hz: number, at: number, attack: number, hold: number, release: number, level: number, out: AudioNode) {
  const osc = e.ctx.createOscillator(), gain = e.ctx.createGain();
  osc.type = type; osc.frequency.setValueAtTime(hz, at);
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(level, at + attack);
  gain.gain.setValueAtTime(level, at + attack + hold);
  gain.gain.exponentialRampToValueAtTime(.0001, at + attack + hold + release);
  osc.connect(gain).connect(out);
  osc.start(at); osc.stop(at + attack + hold + release + .05);
}

function hat(e: Engine, at: number) {
  const noise = e.ctx.createBufferSource(), filter = e.ctx.createBiquadFilter(), gain = e.ctx.createGain();
  const buffer = e.ctx.createBuffer(1, Math.floor(e.ctx.sampleRate * .05), e.ctx.sampleRate), data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  noise.buffer = buffer; filter.type = "highpass"; filter.frequency.value = 7000;
  gain.gain.setValueAtTime(.05, at); gain.gain.exponentialRampToValueAtTime(.0001, at + .05);
  noise.connect(filter).connect(gain).connect(e.master); noise.start(at);
}

function schedule(e: Engine) {
  while (e.at < e.ctx.currentTime + .25) {
    const beat = eighth(e.mood);
    if (e.step % 16 === 0) {
      e.mood = moodFor(bangkokHour()); e.pad.frequency.setTargetAtTime(e.mood.cutoff, e.at, 2);
      if (e.bar % 4 === 0) e.pattern = arpeggio(e.bar + (e.mood.name === "night" ? 7 : 1));
      for (const note of chordNotes(e.mood, e.bar)) voice(e, "triangle", midiToHz(note - 12), e.at, 1.2, beat * 12, 2.2, .055, e.pad);
      voice(e, "sine", midiToHz(chordNotes(e.mood, e.bar)[0] - 24), e.at, .02, beat * 2, 1.4, .16, e.master);
      e.bar += 1;
    }
    const pick = e.pattern[e.step % 16];
    if (pick !== null) { const tones = chordNotes(e.mood, e.bar - 1), note = tones[pick % tones.length] + (pick >= tones.length ? 12 : 0); voice(e, "sine", midiToHz(note + 12), e.at, .005, .02, beat * 2.6, .07, e.echo); }
    if (e.mood.hats && e.step % 2 === 1) hat(e, e.at);
    e.at += beat; e.step += 1;
  }
}

export function startMusic(volume = .22) {
  if (engine || typeof window === "undefined") return;
  const ctx = new AudioContext(), master = ctx.createGain(), pad = ctx.createBiquadFilter(), reverb = ctx.createConvolver(), wet = ctx.createGain();
  const echo = ctx.createGain(), delay = ctx.createDelay(1), feedback = ctx.createGain();
  master.gain.value = 0; master.connect(ctx.destination); master.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2.5);
  pad.type = "lowpass"; pad.Q.value = .4; reverb.buffer = impulse(ctx, 2.8); wet.gain.value = .45;
  pad.connect(master); pad.connect(reverb); reverb.connect(wet).connect(master);
  delay.delayTime.value = .36; feedback.gain.value = .32;
  echo.connect(master); echo.connect(delay); delay.connect(feedback).connect(delay); delay.connect(wet);
  const mood = moodFor(bangkokHour());
  engine = { ctx, master, pad, echo, reverb, timer: 0, step: 0, bar: 0, at: ctx.currentTime + .1, mood, pattern: arpeggio(1) };
  pad.frequency.value = mood.cutoff;
  const e = engine;
  e.timer = window.setInterval(() => schedule(e), 60);
  schedule(e);
}

export function stopMusic() {
  const e = engine;
  if (!e) return;
  engine = null;
  window.clearInterval(e.timer);
  e.master.gain.cancelScheduledValues(e.ctx.currentTime);
  e.master.gain.setTargetAtTime(0, e.ctx.currentTime, .25);
  window.setTimeout(() => void e.ctx.close(), 1500);
}
