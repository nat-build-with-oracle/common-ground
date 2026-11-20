// Things that are only for fun: thrown balls, the Bangkok clock, and saved local display preferences.
import { THEME_KEY, isThemeId, type ThemeId } from "@/lib/themes";
import type { ScrollWheelMode } from "@/lib/camera";
import { setOffice, type Ball, type Vec3 } from "./store.state";

const BALL_COLORS = ["#f2c14e", "#e86a5c", "#5fb4c9", "#9bc472", "#c08ad8"];
const MAX_BALLS = 14; // older balls leave the world as new ones are thrown
let thrown = 0;
const SCROLL_WHEEL_MODE_KEY = "common-ground-scroll-wheel-mode";

function isScrollWheelMode(value: string | null): value is ScrollWheelMode {
  return value === "auto" || value === "zoom" || value === "pan";
}

/** Launch a ball from `pos` with velocity `vel` (m/s). */
export function addBall(pos: Vec3, vel: Vec3) {
  thrown += 1;
  const ball: Ball = { id: thrown, color: BALL_COLORS[thrown % BALL_COLORS.length], pos, vel };
  setOffice(state => ({ balls: [...state.balls.slice(1 - MAX_BALLS), ball] }));
}

/** The hour (0–23) in Bangkok, whatever the viewer's own time zone. */
export function bangkokHour(at = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Bangkok" }).format(at));
}

/** Local display preferences follow the server-rendered defaults after mount. */
export function loadTheme() {
  try {
    const theme = localStorage.getItem(THEME_KEY), scrollWheelMode = localStorage.getItem(SCROLL_WHEEL_MODE_KEY);
    setOffice({ ...(isThemeId(theme) ? { theme } : {}), ...(isScrollWheelMode(scrollWheelMode) ? { scrollWheelMode } : {}) });
  } catch { /* storage blocked */ }
}
export function setTheme(theme: ThemeId) {
  setOffice({ theme });
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* storage blocked */ }
}

export function setScrollWheelMode(scrollWheelMode: ScrollWheelMode) {
  setOffice({ scrollWheelMode });
  try { localStorage.setItem(SCROLL_WHEEL_MODE_KEY, scrollWheelMode); } catch { /* storage blocked */ }
}
