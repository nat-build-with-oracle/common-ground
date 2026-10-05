"use client";
// The 3D nation: one canvas, physics for the things that bounce, and a crowd that walks. Layers live in ./office/.
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { useEffect, useMemo, useState } from "react";
import { exposeForTests } from "@/lib/dev-handles";
import { Nav } from "./crowd";
import FootballScene from "./game/football/football.scene";
import { Homes } from "./home/home";
import Human from "./Human";
import { Citizens } from "./office/office.citizens";
import { Balls } from "./office/office.balls";
import { PhysicsHandle } from "./office/office.dev";
import { Director } from "./office/office.director";
import { Reactor } from "./office/office.reactor";
import { Rooms } from "./office/office.rooms";
import { Lights } from "./office/office.sky";
import { Props } from "./props/props";
import { setOffice, useOffice } from "./store";
import TownMap from "./TownMap";
import { buildWorld, type World } from "./world";

/** The layout changes only when someone arrives, leaves or changes section, not on every status tick. */
function useLayout() {
  const bots = useOffice(state => state.bots), sections = useOffice(state => state.sections);
  const signature = JSON.stringify([sections, bots.map(bot => [bot.id, bot.sectionId, bot.color, bot.project])]);
  return useMemo(() => buildWorld(bots, sections), [signature]); // eslint-disable-line react-hooks/exhaustive-deps
}

/** The walking crowd for a layout. Baking is async (WASM), so a crowd that finishes after its layout is gone is freed at once. */
function useCrowd(world: World) {
  const empty = useOffice(state => state.bots.length === 0);
  const [nav, setNav] = useState<Nav | null>(null);
  useEffect(() => {
    exposeForTests({ __world: world, __nav: null });
    if (empty) return;
    let stale = false, baked: Nav | undefined;
    const { bots, routinesEnabled } = useOffice.getState();
    Nav.create(world, bots, routinesEnabled).then(
      ready => { baked = ready; if (stale) { ready.destroy(); return; } setNav(ready); exposeForTests({ __nav: ready }); },
      (problem: unknown) => setOffice({ error: problem instanceof Error ? problem.message : String(problem) }),
    );
    return () => { stale = true; setNav(null); baked?.destroy(); };
  }, [world, empty]);
  return nav;
}

const deselect = () => setOffice({ selected: null });

export default function Office() {
  const world = useLayout(), nav = useCrowd(world), layer = { world, nav };
  return (
    <>
      <Canvas shadows dpr={[1, 1.25]} camera={{ fov: 38, near: .4, far: 3000, position: [0, 40, 40] }} onPointerMissed={deselect}
        onCreated={({ gl, scene, camera }) => exposeForTests({ __three: { gl, scene, camera } })}>
        <Lights world={world} />
        <Physics>
          <Rooms world={world} />
          <Citizens {...layer} />
          <Human {...layer} />
          <FootballScene {...layer} />
          <Balls />
          <PhysicsHandle />
        </Physics>
        <Props boxes={world.boxes} />
        <Homes households={world.households} />
        <Director {...layer} />
        <Reactor nav={nav} />
      </Canvas>
      <TownMap {...layer} />
    </>
  );
}
