// The nation's score, as plain data: no audio here, so it can be tested.
// Day: C major sevenths at 84 bpm, bright. Night (Bangkok 18:00–06:00): A minor sevenths at 66 bpm, darker.

export type Mood = { name: "day" | "night"; bpm: number; root: number; cutoff: number; chords: number[][]; hats: boolean };

export const DAY: Mood = { name: "day", bpm: 84, root: 60, cutoff: 2600, hats: true, chords: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]] };
export const NIGHT: Mood = { name: "night", bpm: 66, root: 57, cutoff: 1200, hats: false, chords: [[0, 3, 7, 10], [5, 8, 12, 15], [-4, 0, 3, 7], [-2, 2, 5, 8]] };

export function moodFor(hour: number): Mood { return hour >= 18 || hour < 6 ? NIGHT : DAY; }
export const midiToHz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
export const eighth = (mood: Mood) => 60 / mood.bpm / 2;

/** Notes of chord `index` (wrapping), as MIDI numbers. */
export function chordNotes(mood: Mood, index: number): number[] {
  return mood.chords[((index % mood.chords.length) + mood.chords.length) % mood.chords.length].map(step => mood.root + step);
}

/** A repeatable little arpeggio: which chord tone (or rest) plays on each of 16 eighths. */
export function arpeggio(seed: number): (number | null)[] {
  let s = seed * 9301 + 49297;
  const next = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  return Array.from({ length: 16 }, (_, i) => (i % 4 === 0 || next() > .38 ? Math.floor(next() * 6) : null));
}
