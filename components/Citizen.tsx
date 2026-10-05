"use client";
import { useFBX, useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AnimationMixer, Box3, Mesh, SRGBColorSpace, Vector3, type AnimationAction, type AnimationClip, type Group, type Material, type MeshStandardMaterial, type Object3D } from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import type { OracleStatus } from "@/lib/fleet-types";
import { characterSpec, themeById } from "@/lib/themes";
import { useOffice } from "./store";
import type { Rt } from "./crowd";

type Props = { id: string; rt?: Rt; status: OracleStatus };

/** Theme decides which pack dresses the citizen; behavior (walk / sleep / work) stays identical. */
export default function Citizen(props: Props) {
  const spec = characterSpec(themeById(useOffice(s => s.theme)), props.id);
  return spec.kind === "glb" ? <CitizenGlb key={spec.url} {...props} url={spec.url} /> : <CitizenFbx key={spec.model + spec.skin} {...props} spec={spec} />;
}

type Clips = { idle: AnimationClip; walk?: AnimationClip; work?: AnimationClip };

/** Shared body for every theme: fit to ~1.55 units, play idle / walk / work, lie down to sleep at home. */
function Rig({ model, clips, rt, status }: Props & { model: Object3D; clips: Clips }) {
  const { scale, offset } = useMemo(() => {
    model.traverse(node => { if (node instanceof Mesh) { node.castShadow = true; node.receiveShadow = false; } });
    const bounds = new Box3().setFromObject(model, true), size = bounds.getSize(new Vector3());
    const scale = 1.55 / Math.max(.01, size.y);
    return { scale, offset: -bounds.min.y * scale };
  }, [model]);
  const mixer = useMemo(() => new AnimationMixer(model), [model]);
  const pose = useRef<Group>(null);
  const current = useRef<{ name: string; action?: AnimationAction }>({ name: "" });
  useEffect(() => () => { mixer.stopAllAction(); mixer.uncacheRoot(model); current.current = { name: "" }; }, [mixer, model]);
  useFrame((_, delta) => {
    const walking = !!rt && rt.speed > (current.current.name === "walk" ? .12 : .25);
    const sleeping = !!rt && rt.arrived && rt.goal.kind === "home";
    const name = walking ? "walk" : sleeping ? "idle" : status === "working" ? "work" : "idle";
    if (name !== current.current.name) {
      const clip = (name === "walk" ? clips.walk : name === "work" ? clips.work : undefined) ?? clips.idle;
      const action = mixer.clipAction(clip);
      current.current.action?.fadeOut(.35);
      action.reset().fadeIn(.35).play();
      current.current = { name, action };
    }
    if (pose.current) {
      pose.current.rotation.x += ((sleeping ? Math.PI / 2 : 0) - pose.current.rotation.x) * Math.min(1, delta * 5);
      pose.current.position.y = sleeping ? .45 : 0;
    }
    if (current.current.action) current.current.action.timeScale = walking ? Math.max(.25, Math.min(3, (rt?.speed ?? 0) / 1.3)) : sleeping ? 0 : status === "working" ? .35 : .12;
    mixer.update(Math.min(delta, .05));
  });
  return <group ref={pose}><group scale={scale} position-y={offset} dispose={null}><primitive object={model} /></group></group>;
}

/** Each citizen gets an independent node hierarchy and animation mixer. Meshes/textures are shared. */
function CitizenGlb({ url, ...rest }: Props & { url: string }) {
  const gltf = useGLTF(url);
  const model = useMemo(() => gltf.scene.clone(true), [gltf]);
  const clips = useMemo<Clips | null>(() => {
    const by = (name: string) => gltf.animations.find(clip => clip.name === name);
    const idle = by("idle");
    return idle ? { idle, walk: by("walk"), work: by("interact-right") } : null;
  }, [gltf]);
  return clips ? <Rig model={model} clips={clips} {...rest} /> : null;
}

/** Kenney Animated Characters: one FBX rig + per-citizen skin PNG + shared idle/run clips (no walk/work clip). */
function CitizenFbx({ spec, ...rest }: Props & { spec: Extract<ReturnType<typeof characterSpec>, { kind: "fbx" }> }) {
  const source = useFBX(spec.model), idle = useFBX(spec.idle), run = useFBX(spec.run), skin = useTexture(spec.skin);
  const model = useMemo(() => {
    const model = cloneSkinned(source);
    skin.colorSpace = SRGBColorSpace;
    model.traverse(node => {
      if (!(node instanceof Mesh)) return;
      const own = (Array.isArray(node.material) ? node.material : [node.material]).map((material: Material) => {
        const next = material.clone() as MeshStandardMaterial;
        next.map = skin; next.color.set(0xffffff); next.needsUpdate = true;
        const phong = next as unknown as { specular?: { set(value: number): void }; shininess?: number };
        phong.specular?.set(0x1a1a1a); if (phong.shininess !== undefined) phong.shininess = 8;
        return next;
      });
      node.material = Array.isArray(node.material) ? own : own[0];
    });
    return model;
  }, [source, skin]);
  const clips = useMemo<Clips | null>(() => {
    const first = idle.animations[0];
    return first ? { idle: first, walk: run.animations[0] } : null;
  }, [idle, run]);
  return clips ? <Rig model={model} clips={clips} {...rest} /> : null;
}
