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
export const WHEEL_PIXELS_PER_LINE = 32;
export const WHEEL_ZOOM_SENSITIVITY = .0016;
export const PINCH_ZOOM_SENSITIVITY = .01;

export type WheelAction = "pan" | "pinch" | "wheel";
export type WheelBurst = { action: WheelAction; timeStamp: number };
type WheelSample = Pick<WheelEvent, "ctrlKey" | "deltaMode" | "deltaX" | "deltaY" | "shiftKey" | "timeStamp">;

/** Choose one action at the start of a wheel burst and retain it through momentum. */
export function classifyWheelBurst(event: WheelSample, previous?: WheelBurst): WheelBurst {
  if (previous && event.timeStamp - previous.timeStamp <= WHEEL_BURST_GAP)
    return { action: previous.action, timeStamp: event.timeStamp };

  const pixelNotch = event.deltaX === 0 && Math.abs(event.deltaY) >= 50
    && Math.abs(event.deltaY - Math.round(event.deltaY)) < .01;
  const action = event.ctrlKey ? "pinch"
    : event.shiftKey ? "pan"
    : event.deltaMode !== 0 || pixelNotch ? "wheel"
    : "pan";
  return { action, timeStamp: event.timeStamp };
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
