"use client";
import { useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
import { NearestFilter, RepeatWrapping, SRGBColorSpace } from "three";

function Tiled({ url, w, d, cell, roughness }: { url: string; w: number; d: number; cell: number; roughness: number }) {
  const source = useTexture(url);
  const map = useMemo(() => {
    const t = source.clone();
    t.wrapS = t.wrapT = RepeatWrapping; t.magFilter = NearestFilter; t.colorSpace = SRGBColorSpace;
    t.repeat.set(Math.max(1, w / cell), Math.max(1, d / cell)); t.needsUpdate = true;
    return t;
  }, [source, w, d, cell]);
  useEffect(() => () => map.dispose(), [map]);
  return <meshStandardMaterial map={map} roughness={roughness} />;
}

/** Flat color by default; a repeating pixel-art tile when the theme supplies one. Attach inside a <mesh>. */
export function SurfaceMaterial({ color, tile, w, d, cell = 2, roughness = 1 }: { color: string; tile?: string; w: number; d: number; cell?: number; roughness?: number }) {
  const flat = <meshStandardMaterial color={color} roughness={roughness} />;
  return tile ? <Suspense fallback={flat}><Tiled url={tile} w={w} d={d} cell={cell} roughness={roughness} /></Suspense> : flat;
}
