import { classifyWheelBurst, continuesWheelBurst, settleWheelBurst, WHEEL_DECISION_MS, type ScrollWheelMode, type WheelBurst } from "../../lib/camera.ts";

type Navigation = { manualAt: number; selected: string | null };

type Input = {
  acceptsInput(): boolean;
  mode(): ScrollWheelMode;
  resetAnchor(): void;
  wheel(burst: WheelBurst, x: number, y: number, rect: DOMRect): void;
  pinch(factor: number, x: number, y: number, rect: DOMRect): void;
};

export function attachCameraInput(canvas: HTMLElement, nativeGestures: boolean, input: Input) {
  let last: WheelBurst | undefined;
  let discarded = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let flush: (() => void) | undefined;
  let previousScale: number | null = null, touchCount = 0;
  const clearPending = () => {
    clearTimeout(timer);
    timer = undefined;
    flush = undefined;
  };
  const wheel = (event: WheelEvent) => {
    if (!input.acceptsInput()) return;
    const deltaMode = event.deltaMode;
    if (!(event.deltaX || event.deltaY)) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    event.preventDefault();
    if (deltaMode === 0 && event.ctrlKey && previousScale !== null) return;
    const mode = input.mode();
    if (!continuesWheelBurst(event, last, mode)) {
      flush?.();
      discarded = false;
      input.resetAnchor();
    }
    if (discarded && last) {
      last.timeStamp = event.timeStamp;
      return;
    }
    const burst = classifyWheelBurst(event, last, mode);
    last = burst;
    const apply = (resolved: WheelBurst) => input.wheel(resolved, event.clientX, event.clientY, rect);
    if (burst.action !== "pending") {
      clearPending();
      apply(burst);
      return;
    }
    flush = () => {
      clearPending();
      last = settleWheelBurst(burst);
      if (input.acceptsInput()) apply(last);
    };
    timer ??= setTimeout(() => flush?.(), WHEEL_DECISION_MS);
  };
  const touches = (event: TouchEvent) => { touchCount = event.touches.length; };
  const gesture = (raw: Event) => {
    const event = raw as MouseEvent & { scale: number };
    if (event.type === "gestureend" || !input.acceptsInput() || touchCount) { previousScale = null; return; }
    if (!Number.isFinite(event.scale) || event.scale <= 0) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    event.preventDefault();
    if (previousScale === null || event.type === "gesturestart") {
      flush?.();
      last = undefined;
      discarded = false;
      input.resetAnchor();
    }
    if (event.type === "gesturechange" && previousScale !== null)
      input.pinch(previousScale / event.scale, event.clientX, event.clientY, rect);
    previousScale = event.scale;
  };
  const touchEvents = ["touchstart", "touchend", "touchcancel"] as const;
  const gestureEvents = ["gesturestart", "gesturechange", "gestureend"];
  if (nativeGestures) {
    for (const type of touchEvents) canvas.addEventListener(type, touches, { passive: true });
    for (const type of gestureEvents) canvas.addEventListener(type, gesture, { passive: false });
  }
  canvas.addEventListener("wheel", wheel, { passive: false });
  return {
    navigationChanged(current: Navigation, previous: Navigation) {
      if (current.manualAt === previous.manualAt && current.selected === previous.selected) return;
      if (last) discarded = true;
      clearPending();
    },
    dispose() {
      clearPending();
      for (const type of touchEvents) canvas.removeEventListener(type, touches);
      for (const type of gestureEvents) canvas.removeEventListener(type, gesture);
      canvas.removeEventListener("wheel", wheel);
    },
  };
}
