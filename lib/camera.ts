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
export type ScrollWheelMode = "auto" | "zoom" | "pan";
export type WheelBurst = {
  action: WheelAction;
  ctrlKey: boolean;
  mode: ScrollWheelMode;
  shiftKey: boolean;
  timeStamp: number;
  trackpadSeen: boolean;
};
type WheelSample = Pick<WheelEvent, "ctrlKey" | "deltaMode" | "deltaX" | "deltaY" | "shiftKey" | "timeStamp">;

/** Keep momentum consistent unless modifiers, settings, or new trackpad evidence change the action. */
export function classifyWheelBurst(event: WheelSample, previous?: WheelBurst, mode: ScrollWheelMode = "auto"): WheelBurst {
  const trackpadSample = event.deltaX !== 0 || !Number.isInteger(event.deltaY);
  const trackpadSeen = Boolean(previous?.trackpadSeen || trackpadSample);
  const sameBurst = previous && event.timeStamp - previous.timeStamp <= WHEEL_BURST_GAP
    && event.ctrlKey === previous.ctrlKey && event.shiftKey === previous.shiftKey
    && mode === previous.mode;

  const action = event.ctrlKey ? "pinch"
    : event.shiftKey ? "pan"
    : mode === "zoom" ? "wheel"
    : mode === "pan" || trackpadSeen ? "pan"
    : sameBurst ? previous.action
    : event.deltaMode !== 0 || Math.abs(event.deltaY) >= 50 ? "wheel"
    : "pan";
  return { action, ctrlKey: event.ctrlKey, mode, shiftKey: event.shiftKey, timeStamp: event.timeStamp, trackpadSeen };
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
