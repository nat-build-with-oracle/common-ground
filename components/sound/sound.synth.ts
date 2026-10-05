"use client";
// A tiny Web Audio synthesizer for the town's effects: tone sweeps and filtered noise bursts,
// each with its own envelope, stereo pan and gain. No audio files, nothing loaded from anywhere.

export type Tone = { kind: "tone"; wave: OscillatorType; from: number; to?: number; at?: number; attack: number; hold: number; release: number; level: number; wobble?: number };
export type Noise = { kind: "noise"; filter: BiquadFilterType; from: number; to?: number; q?: number; at?: number; attack: number; hold: number; release: number; level: number };
export type Layer = Tone | Noise;

let context: AudioContext | null = null, noiseBuffer: AudioBuffer | null = null;
export function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  context ??= new AudioContext();
  return context;
}
function noise(ctx: AudioContext) {
  if (noiseBuffer) return noiseBuffer;
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}
function envelope(ctx: AudioContext, gain: GainNode, start: number, layer: Layer, scale: number) {
  const peak = layer.level * scale;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), start + Math.max(layer.attack, 0.002));
  gain.gain.setValueAtTime(Math.max(peak, 0.0002), start + layer.attack + layer.hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + layer.attack + layer.hold + layer.release);
  return start + layer.attack + layer.hold + layer.release + 0.02;
}

/** Play a stack of layers now. `pan` is −1 (left) … 1 (right). */
export function play(layers: Layer[], pan = 0, scale = 1) {
  const ctx = audio();
  if (!ctx || ctx.state !== "running") return;
  const out = ctx.createStereoPanner();
  out.pan.value = Math.max(-1, Math.min(1, pan));
  out.connect(ctx.destination);
  for (const layer of layers) {
    const start = ctx.currentTime + (layer.at ?? 0), gain = ctx.createGain();
    let source: AudioScheduledSourceNode, end: number;
    if (layer.kind === "tone") {
      const osc = ctx.createOscillator();
      osc.type = layer.wave;
      osc.frequency.setValueAtTime(layer.from, start);
      end = envelope(ctx, gain, start, layer, scale);
      if (layer.to) osc.frequency.exponentialRampToValueAtTime(layer.to, end - 0.02);
      if (layer.wobble) { const lfo = ctx.createOscillator(), depth = ctx.createGain(); lfo.frequency.value = layer.wobble; depth.gain.value = layer.from * 0.06; lfo.connect(depth).connect(osc.frequency); lfo.start(start); lfo.stop(end); }
      osc.connect(gain);
      source = osc;
    } else {
      const buffer = ctx.createBufferSource(), filter = ctx.createBiquadFilter();
      buffer.buffer = noise(ctx); buffer.loop = true;
      filter.type = layer.filter; filter.Q.value = layer.q ?? 1; filter.frequency.setValueAtTime(layer.from, start);
      end = envelope(ctx, gain, start, layer, scale);
      if (layer.to) filter.frequency.exponentialRampToValueAtTime(layer.to, end - 0.02);
      buffer.connect(filter).connect(gain);
      source = buffer;
    }
    gain.connect(out);
    source.start(start); source.stop(end);
  }
}
