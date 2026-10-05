// Everything the palette can do, as plain data: citizens, places, and actions. Pure, so it is tested.
import type { OracleBot } from "@/lib/fleet-types";
import { STATUS_LABEL } from "../../lib/hud.ts";
import { THEMES } from "../../lib/themes.ts";

export type PaletteAction =
  | { kind: "follow"; id: string } | { kind: "terminal"; id: string } | { kind: "visit"; zone: string } | { kind: "overview" }
  | { kind: "panel"; panel: "cabinet" | "residents" | "journal" | "settings" } | { kind: "walk" } | { kind: "music" } | { kind: "theme"; theme: string }
  | { kind: "football" } | { kind: "map" } | { kind: "clouds" } | { kind: "preview" };
export type PaletteItem = { key: string; group: "Citizens" | "Places" | "Actions"; label: string; hint: string; search: string; action: PaletteAction };
type Place = { id: string; name: string };

export function paletteItems({ bots, zones, preview, walking, music, football = false }: { bots: OracleBot[]; zones: Place[]; preview: boolean; walking: boolean; music: boolean; football?: boolean }): PaletteItem[] {
  const citizens = bots.flatMap(bot => {
    const about = `${STATUS_LABEL[bot.status]} · ${bot.project || "no project"} · ${bot.host}`;
    const follow: PaletteItem = { key: `follow:${bot.id}`, group: "Citizens", label: bot.name, hint: about, search: `${bot.name} ${bot.project} ${bot.host} ${bot.runtime}`, action: { kind: "follow", id: bot.id } };
    return preview ? [follow] : [follow, { key: `terminal:${bot.id}`, group: "Citizens", label: `Terminal: ${bot.name}`, hint: "Full screen, read only", search: `terminal ${bot.name} ${bot.project} ${bot.host}`, action: { kind: "terminal", id: bot.id } } satisfies PaletteItem];
  });
  const places: PaletteItem[] = [{ key: "overview", group: "Places", label: "Whole nation", hint: "The big picture", search: "whole nation overview town map", action: { kind: "overview" } },
    ...zones.map(zone => ({ key: `visit:${zone.id}`, group: "Places" as const, label: zone.name, hint: "Go there", search: `${zone.name} ${zone.id}`, action: { kind: "visit", zone: zone.id } as PaletteAction }))];
  const actions: PaletteItem[] = [
    { key: "walk", group: "Actions", label: walking ? "Stop walking" : "Walk as yourself", hint: "H", search: "walk human play yourself avatar", action: { kind: "walk" } },
    { key: "football", group: "Actions", label: football ? "End match" : "Play football", hint: "G", search: "football soccer match play game pitch sport end stop", action: { kind: "football" } },
    { key: "music", group: "Actions", label: music ? "Stop the music" : "Play nation music", hint: "B", search: "music bgm sound song play", action: { kind: "music" } },
    { key: "cabinet", group: "Actions", label: "Open the cabinet", hint: "C", search: "cabinet ministries government counts", action: { kind: "panel", panel: "cabinet" } },
    { key: "residents", group: "Actions", label: "Open the residents", hint: "R", search: "residents people roster list", action: { kind: "panel", panel: "residents" } },
    { key: "journal", group: "Actions", label: "Open field notes", hint: "J", search: "journal notes log feed", action: { kind: "panel", panel: "journal" } },
    { key: "settings", group: "Actions", label: "Open settings", hint: "", search: "settings options sources", action: { kind: "panel", panel: "settings" } },
    { key: "map", group: "Actions", label: "Unfold the field atlas", hint: "M", search: "map atlas", action: { kind: "map" } },
    { key: "clouds", group: "Actions", label: "Toggle terminal thought clouds", hint: "T", search: "terminal clouds thoughts", action: { kind: "clouds" } },
    { key: "preview", group: "Actions", label: preview ? "Back to live sources" : "Explore the synthetic preview", hint: "", search: "preview synthetic demo live", action: { kind: "preview" } },
    ...THEMES.map(theme => ({ key: `theme:${theme.id}`, group: "Actions" as const, label: `Theme: ${theme.name}`, hint: theme.blurb, search: `theme look skin ${theme.name}`, action: { kind: "theme", theme: theme.id } as PaletteAction })),
  ];
  return [...citizens, ...places, ...actions];
}
