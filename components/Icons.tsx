import type { ReactNode, SVGProps } from "react";

type Name = "notes" | "settings" | "terminal" | "map" | "home" | "work" | "community" | "coffee" | "beer" | "parliament" | "globe" | "cabinet" | "walk" | "music" | "garden" | "waiting" | "ball" | "camera" | "close" | "external" | "lock" | "mute" | "offline" | "overview" | "rain" | "refresh" | "roster" | "search" | "sound";
const paths: Record<Name, ReactNode> = {
  notes: <><path d="M5 3h14v18H5zM9 8h6M9 12h6M9 16h4M3 7h3M3 12h3M3 17h3" /></>,
  settings: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" fill="currentColor" /><circle cx="15" cy="12" r="2" fill="currentColor" /><circle cx="8" cy="18" r="2" fill="currentColor" /></>,
  terminal: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3m6 0h4" /></>,
  map: <><path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16" /></>,
  home: <><path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-8h6v8" /></>,
  work: <><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M8 8V4h8v4M3 13h18M10 13v3h4v-3" /></>,
  community: <><path d="m3 10 9-7 9 7M5 10v11h14V10M2 21h20M8 13v5m4-5v5m4-5v5" /></>,
  coffee: <><path d="M4 8h13v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Zm13 2h2a3 3 0 0 1 0 6h-2M7 3v2m4-2v2M3 22h17" /></>,
  beer: <><path d="M5 7h11v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2Zm11 2h2a2.5 2.5 0 0 1 0 5h-2M5 7a3 3 0 0 1 3-3 3 3 0 0 1 5-1 3 3 0 0 1 3 4M9 11v6m3-6v6" /></>,
  parliament: <><path d="M3 21h18M5 21v-8m4 8v-8m6 8v-8m4 8v-8M3 13h18M5 13a7 7 0 0 1 14 0M12 6V3" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></>,
  cabinet: <><path d="M4 4h16v16H4zM4 9h16M4 14h16M10 6.5h4M10 11.5h4M10 16.5h4" /></>,
  walk: <><circle cx="13" cy="4" r="2" /><path d="m9 21 2-6 3 2v4M7 12l3-4 4 1 3 3M11 15l-1-4" /></>,
  music: <><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></>,
  garden: <><path d="M12 22V11M12 16C3 16 3 7 3 7s9-1 9 9Zm0-4C12 3 21 3 21 3s1 9-9 9Z" /></>,
  waiting: <><path d="M4 12h16v6H4zM5 18v3m14-3v3M6 12V7h12v5M2 10v8m20-8v8" /></>,
  ball: <><circle cx="12" cy="12" r="8" /><path d="M5 9c4 0 7-2 9-5M10 20c0-5 3-9 8-11M4 14c5 0 9 2 12 6" /></>, camera: <><path d="M3 7h4l2-2h6l2 2h4v11H3z" /><circle cx="12" cy="12.5" r="3.5" /></>, close: <path d="m6 6 12 12M18 6 6 18" />, external: <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6H5V6h6" /></>, lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>, mute: <><path d="M5 10h4l5-4v12l-5-4H5zM18 9l4 4M22 9l-4 4" /></>, offline: <><path d="M3 8a14 14 0 0 1 18 0M6 12a9 9 0 0 1 7-2M9 16a4 4 0 0 1 2-.7" /><path d="m3 3 18 18" /></>, overview: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>, rain: <><path d="M6 15a4 4 0 0 1 1-7.9A6 6 0 0 1 18.5 9 3 3 0 0 1 18 15z" /><path d="m8 18-1 2M12 18l-1 2M16 18l-1 2" /></>, refresh: <><path d="M20 6v5h-5" /><path d="M18.5 16a8 8 0 1 1 .7-7l.8 2" /></>, roster: <><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20v-2a5 5 0 0 1 10 0v2M14 20v-1.5a4 4 0 0 1 7 0V20" /></>, search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>, sound: <><path d="M5 10h4l5-4v12l-5-4H5zM17 9a5 5 0 0 1 0 6M19.5 6.5a9 9 0 0 1 0 11" /></>,
};
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: Name }) { return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>; }
