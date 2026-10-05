import { stableHash } from "./life.ts";

export type ThemeId = "blocky" | "retro" | "survivors" | "protagonists" | "urban";
export type Theme = {
  id: ThemeId; name: string; blurb: string;
  /** glb = Kenney Blocky (18 baked characters), fbx = shared rig + swappable skins. */
  kind: "glb" | "fbx";
  ground: string; road: string; walk: string;
  /** 16px pixel-art tiles for the ground / roads / walkways (Urban theme only). */
  groundTile?: string; roadTile?: string; walkTile?: string;
};

export const THEMES: Theme[] = [
  { id: "blocky", name: "Blocky", blurb: "18 blocky citizens · sit, walk, work", kind: "glb", ground: "#a9bd94", road: "#667879", walk: "#d0c7aa" },
  { id: "retro", name: "Retro", blurb: "Neighbors and zombies, casual clothes", kind: "fbx", ground: "#c4b48e", road: "#6e6a64", walk: "#d9ccaa" },
  { id: "survivors", name: "Survivors", blurb: "Survivors and the undead · muted town", kind: "fbx", ground: "#8d937c", road: "#5a5f5f", walk: "#b9b49c" },
  { id: "protagonists", name: "Protagonists", blurb: "Heroes in bold colors · cool streets", kind: "fbx", ground: "#9bb6c4", road: "#5f6e7c", walk: "#cfd6d9" },
  { id: "urban", name: "Urban", blurb: "Blocky citizens on RPG Urban pixel tiles", kind: "glb", ground: "#aaa8bd", road: "#5b6177", walk: "#a8acb7", groundTile: "/models/urban/tile_0036.png", roadTile: "/models/urban/tile_0441.png", walkTile: "/models/urban/tile_0117.png" },
];
export const DEFAULT_THEME: ThemeId = "blocky";
export const THEME_KEY = "office-town:theme";
export function themeById(id: string | null | undefined): Theme { return THEMES.find(theme => theme.id === id) ?? THEMES[0]; }
export function isThemeId(id: unknown): id is ThemeId { return THEMES.some(theme => theme.id === id); }
export function nextTheme(id: ThemeId): ThemeId { return THEMES[(THEMES.findIndex(theme => theme.id === id) + 1) % THEMES.length].id; }

/** FBX packs: one `characterMedium.fbx` rig, per-citizen skin PNG, shared idle/run clips. */
export const FBX_SKINS: Record<"retro" | "survivors" | "protagonists", string[]> = {
  retro: ["humanFemaleA", "humanMaleA", "zombieFemaleA", "zombieMaleA"],
  survivors: ["survivorFemaleA", "survivorMaleB", "zombieA", "zombieC"],
  protagonists: ["criminalMaleA", "cyborgFemaleA", "skaterFemaleA", "skaterMaleA"],
};
const BLOCKY = "abcdefghijklmnopqr";

export type CharacterSpec =
  | { kind: "glb"; url: string }
  | { kind: "fbx"; model: string; skin: string; idle: string; run: string };

export function characterSpec(theme: Theme, id: string): CharacterSpec {
  const hash = stableHash(id);
  if (theme.kind === "glb") return { kind: "glb", url: `/models/kenney/character-${BLOCKY[hash % BLOCKY.length]}.glb` };
  const pack = theme.id as keyof typeof FBX_SKINS, skins = FBX_SKINS[pack], base = `/models/${pack}`;
  return { kind: "fbx", model: `${base}/characterMedium.fbx`, skin: `${base}/Skins/${skins[hash % skins.length]}.png`, idle: `${base}/Animations/idle.fbx`, run: `${base}/Animations/run.fbx` };
}
