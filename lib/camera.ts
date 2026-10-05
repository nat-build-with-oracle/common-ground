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
