// Material sets for homes. Each home gets two: `base` (never fades) and `upper` (fades when it is in the way).
import { Color, MeshStandardMaterial } from "three";
import type { HouseStyle } from "../world";

export type MatName = "wall" | "trim" | "wood" | "floor" | "roof" | "dark" | "steel" | "leaf" | "glass" | "accent" | "glow" | "fabric" | "paper" | "window" | "pot";
export type Mats = Record<MatName, MeshStandardMaterial>;

/** Per-style colours: concrete townhouses and condos, teak stilt houses, white villas, cream cottages. */
const PALETTE: Record<HouseStyle, { wall: string; trim: string; wood: string; floor: string; roof: string }> = {
  townhouse: { wall: "#ece7df", trim: "#d8d1c6", wood: "#d9b07a", floor: "#d9b07a", roof: "#e3ddd3" },
  condo: { wall: "#e6e2da", trim: "#b9c3c9", wood: "#c9a27a", floor: "#cbb89a", roof: "#d7d2c8" },
  stilt: { wall: "#9a6a3e", trim: "#7a5230", wood: "#8b5e34", floor: "#a57447", roof: "#8e3b2c" },
  villa: { wall: "#f4f2ee", trim: "#2f343b", wood: "#b07a4e", floor: "#d8c7ad", roof: "#f4f2ee" },
  cottage: { wall: "#f1e3c6", trim: "#ffffff", wood: "#c49a6c", floor: "#d6b88f", roof: "#c0603f" },
};

export function makeMats(style: HouseStyle, accent: string): Mats {
  const p = PALETTE[style];
  const m = (color: string, extra: Partial<MeshStandardMaterial> = {}) => Object.assign(new MeshStandardMaterial({ color, roughness: .85 }), extra);
  return {
    wall: m(p.wall), trim: m(p.trim), wood: m(p.wood, { roughness: .7 }), floor: m(p.floor, { roughness: .7 }), roof: m(p.roof, { roughness: .8 }),
    dark: m("#30343c", { roughness: .6 }), steel: m("#c9d2d6", { roughness: .35, metalness: .55 }), leaf: m("#4f9a5c", { flatShading: true }),
    glass: m("#bfe3f0", { roughness: .1, transparent: true, opacity: .32 }),
    accent: m(accent), glow: m(accent, { emissive: new Color(accent), emissiveIntensity: .9 }),
    fabric: m(new Color(accent).lerp(new Color("#f4efe6"), .35).getStyle()), paper: m("#f6f1e4"), pot: m("#c56b4a"),
    window: m("#9cc6d6", { roughness: .2, emissive: new Color("#ffc46b"), emissiveIntensity: 0 }),
  };
}

/** How tall each style stands (for the camera's line-of-sight test). */
export function houseTop(style: HouseStyle, floors: number) {
  return style === "stilt" ? 5.6 : style === "cottage" ? 3.6 : style === "villa" ? 5.0 : floors * 1.85 + 1.5;
}
