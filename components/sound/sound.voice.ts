"use client";
// Citizens speaking Thai through the browser's own speech engine, using only voices installed on
// this computer (so no text leaves it). One voice; each citizen gets a steady pitch of its own.
import { stableHash } from "@/lib/life";
import { setOffice, useOffice } from "../store";

const LINES = {
  start: ["เริ่มงานแล้วครับ", "ได้เลย จัดการให้ครับ", "โอเค ลงมือเลย"],
  done: ["งานนี้เสร็จแล้วครับ", "เรียบร้อยดีครับ", "เสร็จแล้ว ไปพักก่อนนะ"],
  ask: ["รบกวนช่วยตอบหน่อยครับ", "ต้องการคำตัดสินจากคุณครับ"],
  fail: ["มีอะไรผิดพลาดครับ", "ติดปัญหาอยู่ครับ"],
  hit: ["โอ๊ะ!", "เบา ๆ หน่อย!", "ใครปาลูกบอลมา!", "ระวังด้วยสิ!"],
  hello: ["สวัสดีครับ", "หวัดดี มีอะไรให้ช่วยครับ", "ยินดีที่ได้เจอครับ"],
};
export type LineKind = keyof typeof LINES;
export const phrase = (kind: LineKind) => LINES[kind][Math.floor(Math.random() * LINES[kind].length)];

let chosen: SpeechSynthesisVoice | null | undefined;
export function localThaiVoice() {
  if (chosen || typeof speechSynthesis === "undefined") return chosen ?? null;
  chosen = speechSynthesis.getVoices().filter(voice => voice.localService).find(voice => /^th\b/i.test(voice.lang)) ?? null;
  return chosen;
}

/** Make a line speakable: no links, markup or emoji; one short sentence. */
export function speakable(text: string) {
  return text.replace(/https?:\/\/\S+/g, " ลิงก์ ").replace(/[`*_#>|~[\]()]/g, " ").replace(/\p{Extended_Pictographic}/gu, "").replace(/\s+/g, " ").trim().slice(0, 140);
}

let speaking = 0;
export function speak(botId: string, text: string) {
  const state = useOffice.getState(), voice = localThaiVoice(), line = speakable(text);
  if (!state.sound || !state.voice || !voice || !line || speaking > 1) return;
  const utterance = Object.assign(new SpeechSynthesisUtterance(line), { voice, lang: voice.lang, rate: 1.05, volume: .9, pitch: .8 + (stableHash(`voice:${botId}`) % 50) / 50 });
  speaking += 1;
  utterance.onstart = () => setOffice({ caption: { botId, text: line } });
  utterance.onend = utterance.onerror = () => { speaking = Math.max(0, speaking - 1); setOffice(current => current.caption?.text === line ? { caption: null } : {}); };
  speechSynthesis.speak(utterance);
}
export function quiet() { speaking = 0; if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel(); setOffice({ caption: null }); }
