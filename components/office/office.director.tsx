"use client";
// The camera. While you walk it follows you (between you and the ball during a match). Otherwise it frames whoever
// is selected, a district picked by hand, a working citizen on tour, or the whole town. Dragging or scrolling holds
// it still for a while. It publishes what it looks at (focus.lookAt) so homes standing in the way can fade.
import { CameraControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { townFrame } from "@/lib/camera";
import type { Nav, Rt } from "../crowd";
import { lookAt } from "../focus";
import { ballCam } from "../game/football/football.store";
import { setOffice, useOffice, type State } from "../store";
import type { World } from "../world";

const HOLD_AFTER_ORBIT = 15_000; // ms the camera leaves you alone after you drag or scroll it
const FLY_DOWN = 2_500;          // ms of slow arrival when a walk starts from the god view
const TOUR_STOP = 10_000;        // ms on each working citizen while touring

type Memory = { shot: string; holdUntil: number; nextAim: number; pickedAt: number; selected: string | null; walkingSince: number };
/** Shots are keyed "bot:<id>", "zone:<id>", "overview", "player" or "match". */
const citizenIn = (shot: string) => shot.startsWith("bot:") ? shot.slice(4) : null;

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
  const size = useThree(three => three.size);
  const memory = useRef<Memory>({ shot: "", holdUntil: 0, nextAim: 0, pickedAt: 0, selected: null, walkingSince: 0 });
  useEffect(() => {
    const camera = controls.current!;
    camera.smoothTime = .55;
    const hold = () => { memory.current.holdUntil = performance.now() + HOLD_AFTER_ORBIT; };
    camera.addEventListener("controlstart", hold);
    return () => camera.removeEventListener("controlstart", hold);
  }, []);
  // A new layout or window size: frame again straight away.
  useEffect(() => { Object.assign(memory.current, { nextAim: 0, holdUntil: 0 }); }, [world, size.width, size.height]);

  useFrame((_, dt) => {
    const camera = controls.current, state = useOffice.getState(), now = performance.now(), m = memory.current;
    if (!camera) return; // an empty town still has a camera, crowd or not
    camera.getTarget(lookAt.target); lookAt.active = true;
    const me = state.walking ? nav?.playerRt : undefined;
    m.walkingSince = me ? m.walkingSince || now : 0;
    camera.smoothTime = !me || ballCam.live ? .55 : now - m.walkingSince < FLY_DOWN ? 1.2 : .18; // then keep up with a sprint
    if (me) return follow(camera, m, me);

    if (state.manualAt !== m.pickedAt || state.selected !== m.selected) Object.assign(m, { pickedAt: state.manualAt, selected: state.selected, holdUntil: 0, nextAim: 0 });
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
  return <CameraControls ref={controls} makeDefault maxPolarAngle={Math.PI * .46} minDistance={3} maxDistance={Math.max(world.w, world.d) * 12} />;
}
