/** Fit the ground rectangle in a perspective camera, including portrait canvases. */
export function townFrame(width: number, depth: number, aspect: number, fov = 38) {
  const tilt = Math.PI / 3;
  const tanV = Math.tan(fov * Math.PI / 360);
  const safeAspect = Math.max(0.1, aspect);
  const halfDepth = depth / 2;
  const distance = Math.max(width / (2 * tanV * safeAspect), (halfDepth * Math.sin(tilt) + 4) / tanV)
    * 1.12 + halfDepth * Math.cos(tilt);
  return { y: distance * Math.sin(tilt), z: distance * Math.cos(tilt), distance };
}

export const WHEEL_BURST_GAP = 150;
export const WHEEL_DECISION_MS = 40;
export const WHEEL_PIXELS_PER_LINE = 32;
export const WHEEL_ZOOM_SENSITIVITY = .0016;
export const PINCH_ZOOM_SENSITIVITY = .01;

export type WheelAction = "pan" | "pinch" | "wheel";
export type WheelBurstAction = WheelAction | "pending";
export type ScrollWheelMode = "auto" | "zoom" | "pan";
export type WheelBurst = {
  action: WheelBurstAction;
  ctrlKey: boolean;
  deltaMode: number;
  deltaX: number;
  deltaY: number;
  deltaYs: number[];
  mode: ScrollWheelMode;
  shiftKey: boolean;
  startedAt: number;
  timeStamp: number;
};
export type WheelSample = Pick<WheelEvent, "ctrlKey" | "deltaMode" | "deltaX" | "deltaY" | "shiftKey" | "timeStamp">;

/** Whether an event belongs to the same unmodified hardware burst. */
export function continuesWheelBurst(event: WheelSample, previous: WheelBurst | undefined, mode: ScrollWheelMode) {
  return Boolean(previous && event.timeStamp - previous.timeStamp <= WHEEL_BURST_GAP
    && event.deltaMode === previous.deltaMode
    && event.ctrlKey === previous.ctrlKey && event.shiftKey === previous.shiftKey
    && mode === previous.mode);
}

/** Buffer an ambiguous first pixel sample, then keep one action through the burst's momentum. */
export function classifyWheelBurst(event: WheelSample, previous?: WheelBurst, mode: ScrollWheelMode = "auto"): WheelBurst {
  const prior = continuesWheelBurst(event, previous, mode) ? previous : undefined;
  const pending = prior?.action === "pending" ? prior : undefined;
  const trackpadSample = event.deltaX !== 0 || !Number.isInteger(event.deltaY);
  let action: WheelBurstAction;
  if (event.deltaMode !== 0) action = event.shiftKey || mode === "pan" ? "pan" : "wheel";
  else if (event.ctrlKey) action = "pinch";
  else if (event.shiftKey || mode === "pan") action = "pan";
  else if (mode === "zoom") action = "wheel";
  else if (prior && prior.action !== "pending") action = prior.action;
  else if (pending) {
    const inWindow = event.timeStamp - pending.startedAt <= WHEEL_DECISION_MS;
    action = inWindow ? (trackpadSample ? "pan" : "pending") : settleWheelBurst(pending).action;
  } else action = trackpadSample ? "pan" : "pending";

  return {
    action,
    ctrlKey: event.ctrlKey,
    deltaMode: event.deltaMode,
    deltaX: event.deltaX + (pending?.deltaX ?? 0),
    deltaY: event.deltaY + (pending?.deltaY ?? 0),
    deltaYs: pending ? [...pending.deltaYs, event.deltaY] : [event.deltaY],
    mode,
    shiftKey: event.shiftKey,
    startedAt: pending?.startedAt ?? event.timeStamp,
    timeStamp: event.timeStamp,
  };
}

/** Resolve a lone ambiguous pixel sample after the brief evidence window closes. */
export function settleWheelBurst(burst: WheelBurst): WheelBurst {
  return burst.action === "pending" ? { ...burst, action: Math.abs(burst.deltaY) >= 50 ? "wheel" : "pan" } : burst;
}

/** Normalize browser wheel units into pixels before applying camera scaling. */
export function wheelPixels(delta: number, mode: number, pageHeight: number) {
  const unit = mode === 1 ? WHEEL_PIXELS_PER_LINE : mode === 2 ? pageHeight : 1;
  return delta * unit;
}

/** Continuous pixel deltas, with a cap for accelerated wheels and page-mode devices. */
export function wheelZoomFactor(pixels: number, pinch: boolean) {
  const sensitivity = pinch ? PINCH_ZOOM_SENSITIVITY : WHEEL_ZOOM_SENSITIVITY;
  return Math.exp(Math.max(-.24, Math.min(.24, pixels * sensitivity)));
}

/** Apply accelerated-wheel limiting independently to every sample buffered for classification. */
export function wheelBurstZoomFactor(burst: WheelBurst, pageHeight: number) {
  return burst.deltaYs.reduce((factor, deltaY) =>
    factor * wheelZoomFactor(wheelPixels(deltaY, burst.deltaMode, pageHeight), burst.action === "pinch"), 1);
}
