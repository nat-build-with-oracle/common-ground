"use client";
// The camera. While you walk it follows you (between you and the ball during a match). Otherwise it frames whoever
// is selected, a district picked by hand, a working citizen on tour, or the whole town. Dragging or scrolling holds
// it still for a while. It publishes what it looks at (focus.lookAt) so homes standing in the way can fade.
import { CameraControls, CameraControlsImpl } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { PerspectiveCamera, Raycaster, Spherical, Vector2, Vector3 } from "three";
import { type WheelBurst, townFrame, wheelPixels, wheelBurstZoomFactor } from "@/lib/camera";
import type { Nav, Rt } from "../crowd";
import { lookAt } from "../focus";
import { ballCam } from "../game/football/football.store";
import { setOffice, useOffice, type State } from "../store";
import type { World } from "../world";
import { attachCameraInput } from "./office.camera-input";
import { createTownZoomAnchorCache } from "./office.camera-anchor";
import { followSmoothTime, updateFollowTiming } from "./office.camera-follow";

const HOLD_AFTER_ORBIT = 15_000; // ms the camera leaves you alone after you drag or scroll it
const MANUAL_SMOOTH_MS = 350;
const TOUR_STOP = 10_000;        // ms on each working citizen while touring

type Memory = { shot: string; holdUntil: number; manualUntil: number; followPausedUntil: number; nextAim: number; pickedAt: number; selected: string | null; walkingSince: number };
/** Shots are keyed "bot:<id>", "zone:<id>", "overview", "player" or "match". */
const citizenIn = (shot: string) => shot.startsWith("bot:") ? shot.slice(4) : null;

const followedPlayer = (state: State, nav: Nav | null) => state.walking ? nav?.playerRt : undefined;

/** What to frame when you are not walking. */
function pickShot(state: State, nav: Nav | null, current: string) {
  if (state.selected) return `bot:${state.selected}`;
  if (state.manual) return state.manual.kind === "zone" ? `zone:${state.manual.id}` : "overview";
  if (state.auto) {
    const working = state.bots.filter(bot => bot.working && nav?.rts.has(bot.id));
    return working.length ? `bot:${working[Math.floor(Date.now() / TOUR_STOP) % working.length].id}` : "overview";
  }
  return (citizenIn(current) || current.startsWith("zone:")) ? current : "overview"; // after a walk: back to the town
}

/** Arrive once with a framing, then move only the target: your zoom (scroll) and orbit (drag) stay as you set them. */
function follow(controls: CameraControls, memory: Memory, me: Rt) {
  const match = ballCam.live, shot = match ? "match" : "player";
  const x = match ? (ballCam.x * 2 + me.x) / 3 : me.x, z = match ? (ballCam.z * 2 + me.z) / 3 : me.z, y = match ? .5 : 1;
  if (memory.shot === shot) { void controls.moveTo(x, y, z, true); return; }
  if (!match) setOffice({ focus: null });
  memory.shot = shot;
  const back = match ? 15 : 8.6, up = match ? 12 : 6.4, turn = controls.azimuthAngle;
  void controls.setLookAt(x + Math.sin(turn) * back, up, z + Math.cos(turn) * back, x, y, z, true);
}

export function Director({ world, nav }: { world: World; nav: Nav | null }) {
  const controls = useRef<CameraControls>(null);
  const canvas = useThree(three => three.gl.domElement);
  const scene = useThree(three => three.scene);
  const size = useThree(three => three.size);
  const memory = useRef<Memory>({ shot: "", holdUntil: 0, manualUntil: 0, followPausedUntil: 0, nextAim: 0, pickedAt: 0, selected: null, walkingSince: 0 });
  useEffect(() => {
    const camera = controls.current!;
    const end = new Spherical();
    const hold = () => { memory.current.holdUntil = performance.now() + HOLD_AFTER_ORBIT; };
    const pauseWalkingFollow = () => {
      if (followedPlayer(useOffice.getState(), nav)) memory.current.followPausedUntil = memory.current.holdUntil;
    };
    const nativeControl = () => {
      hold();
      const action = CameraControlsImpl.ACTION;
      if (camera.currentAction === action.TOUCH_DOLLY_TRUCK || camera.currentAction === action.TOUCH_TRUCK
        || camera.currentAction === action.TOUCH_SCREEN_PAN || camera.currentAction === action.TOUCH_ZOOM_TRUCK)
        pauseWalkingFollow();
    };
    // Native ctrl-wheel changes lens zoom instead of distance, bypassing the town's dolly limits.
    camera.mouseButtons.wheel = CameraControlsImpl.ACTION.NONE;
    const ray = new Raycaster(), pointer = new Vector2(), anchor = new Vector3(), target = new Vector3();
    const anchorCache = createTownZoomAnchorCache();
    const acceptsInput = () => {
      const state = useOffice.getState();
      return camera.enabled && !state.paletteOpen && !state.terminalFull && camera.camera instanceof PerspectiveCamera;
    };
    const moved = () => {
      hold();
      memory.current.manualUntil = performance.now() + MANUAL_SMOOTH_MS;
    };
    const dolly = (factor: number, x: number, y: number, rect: DOMRect) => {
      const radius = camera.getSpherical(end, true).radius;
      const next = Math.max(camera.minDistance, Math.min(camera.maxDistance, radius * factor));
      const inspecting = performance.now() < memory.current.followPausedUntil;
      if (inspecting && factor !== 1) {
        hold();
        pauseWalkingFollow();
      }
      if (next === radius) return;
      if (inspecting || !followedPlayer(useOffice.getState(), nav)) {
        pointer.set(2 * (x - rect.left) / rect.width - 1, 1 - 2 * (y - rect.top) / rect.height);
        ray.setFromCamera(pointer, camera.camera);
        if (anchorCache.resolve(x, y, ray, scene, world.w, world.d, anchor)) {
          // Scale the pending camera pose about the nearest visible town surface, including its target.
          camera.getTarget(target, true).lerp(anchor, 1 - next / radius);
          void camera.moveTo(target.x, target.y, target.z, true);
        }
      }
      void camera.dollyTo(next, true);
      moved();
    };
    const applyWheel = (burst: WheelBurst, x: number, y: number, rect: DOMRect) => {
      const dy = wheelPixels(burst.deltaY, burst.deltaMode, rect.height);
      if (burst.action === "pan") {
        const radius = camera.getSpherical(end, true).radius;
        const unit = 2 * radius * Math.tan((camera.camera as PerspectiveCamera).getEffectiveFOV() * Math.PI / 360) / rect.height;
        void camera.truck(wheelPixels(burst.deltaX, burst.deltaMode, rect.height) * unit, dy * unit, true);
        moved();
        pauseWalkingFollow();
      } else {
        dolly(wheelBurstZoomFactor(burst, rect.height), x, y, rect);
      }
    };
    const input = attachCameraInput(canvas, "GestureEvent" in window, {
      acceptsInput, mode: () => useOffice.getState().scrollWheelMode, resetAnchor: () => anchorCache.reset(),
      wheel: applyWheel, pinch: dolly,
    });
    const unsubscribeNavigation = useOffice.subscribe((current, previous) => {
      input.navigationChanged(current, previous);
      if (previous.walking && !current.walking) updateFollowTiming(memory.current, false, performance.now());
    });
    camera.addEventListener("control", nativeControl);
    return () => {
      unsubscribeNavigation();
      input.dispose();
      camera.removeEventListener("control", nativeControl);
    };
  }, [canvas, nav, scene, world]);
  // A new layout or window size: frame again straight away.
  useEffect(() => { Object.assign(memory.current, { nextAim: 0, holdUntil: 0 }); }, [world, size.width, size.height]);

  useFrame((_, dt) => {
    const camera = controls.current, state = useOffice.getState(), now = performance.now(), m = memory.current;
    if (!camera) return; // an empty town still has a camera, crowd or not
    camera.getTarget(lookAt.target); lookAt.active = true;
    const me = followedPlayer(state, nav);
    if (state.manualAt !== m.pickedAt || state.selected !== m.selected) {
      Object.assign(m, { pickedAt: state.manualAt, selected: state.selected, holdUntil: 0, manualUntil: 0, followPausedUntil: 0, nextAim: 0 });
    }
    const followPaused = updateFollowTiming(m, Boolean(me), now);
    camera.dollyToCursor = !me || followPaused; // Native touch uses its pinch midpoint during inspection.
    camera.smoothTime = !me ? (now < m.manualUntil ? .12 : .55) : followSmoothTime(m, now, ballCam.live);
    if (me) {
      if (!followPaused) follow(camera, m, me);
      return;
    }

    if (now < m.holdUntil) return;
    const shot = pickShot(state, nav, m.shot), citizen = citizenIn(shot);
    if (shot !== m.shot) { m.shot = shot; m.nextAim = 0; setOffice({ focus: citizen }); }
    m.nextAim -= dt;
    if (m.nextAim > 0) return;
    if (citizen) {
      const at = nav?.rts.get(citizen) ?? world.seats.get(citizen);
      if (!at) return;
      m.nextAim = .5; // they may be walking: re-aim twice a second
      void camera.setLookAt(at.x + 4, 7.5, at.z + 9, at.x, 1.1, at.z, true);
      return;
    }
    const zone = shot.startsWith("zone:") ? world.zones.find(candidate => candidate.id === shot.slice(5)) : undefined;
    const frame = townFrame(zone ? zone.w + 2 : world.w + 8, zone ? zone.d + 2 : world.d + 8, size.width / Math.max(1, size.height));
    const cx = zone?.x ?? 0, cz = zone?.z ?? 0;
    m.nextAim = Infinity; // a place stands still: aim once
    void camera.setLookAt(cx, frame.y, cz + frame.z, cx, 0, cz, true);
  });
  const overview = townFrame(world.w + 8, world.d + 8, size.width / Math.max(1, size.height));
  return <CameraControls ref={controls} domElement={canvas} makeDefault maxPolarAngle={Math.PI * .46} minDistance={3} maxDistance={overview.distance * 1.25} />;
}
