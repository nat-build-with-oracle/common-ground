import { Plane, Vector3, type Intersection, type Material, type Mesh, type Object3D, type Raycaster, type Scene } from "three";

const GROUND = new Plane(new Vector3(0, 1, 0), 0);
export const ZOOM_ANCHOR_POINTER_DRIFT = 4;

function hitMaterial(hit: Intersection<Object3D>) {
  const mesh = hit.object as Mesh, material = mesh.material;
  return Array.isArray(material) ? material[hit.face?.materialIndex ?? 0] : material;
}

function isRendered(material: Material | undefined) {
  return !!material?.visible && (!material.transparent || material.opacity > 0);
}

/** Pick the closest rendered town surface, with a bounded ground-plane fallback. */
export function townZoomAnchor(ray: Raycaster, scene: Scene, width: number, depth: number, anchor: Vector3) {
  const halfWidth = width / 2, halfDepth = depth / 2;
  const inside = (point: Vector3) => Math.abs(point.x) <= halfWidth && Math.abs(point.z) <= halfDepth;
  const meshes: Object3D[] = [];
  scene.traverseVisible(object => { if ((object as Mesh).isMesh) meshes.push(object); });
  const surface = ray.intersectObjects(meshes, false).find(hit => isRendered(hitMaterial(hit)) && inside(hit.point));
  if (surface) {
    anchor.copy(surface.point);
    return true;
  }
  if (!ray.ray.intersectPlane(GROUND, anchor)) return false;
  anchor.set(Math.max(-halfWidth, Math.min(halfWidth, anchor.x)), 0, Math.max(-halfDepth, Math.min(halfDepth, anchor.z)));
  return true;
}

/** Reuse one resolved anchor while a zoom burst stays near the same screen point. */
export function createTownZoomAnchorCache() {
  const cachedAnchor = new Vector3();
  let cached = false, found = false, pointerX = 0, pointerY = 0;

  return {
    reset() { cached = false; },
    resolve(x: number, y: number, ray: Raycaster, scene: Scene, width: number, depth: number, anchor: Vector3) {
      const dx = x - pointerX, dy = y - pointerY;
      if (cached && dx * dx + dy * dy <= ZOOM_ANCHOR_POINTER_DRIFT ** 2) {
        if (found) anchor.copy(cachedAnchor);
        return found;
      }
      pointerX = x;
      pointerY = y;
      found = townZoomAnchor(ray, scene, width, depth, anchor);
      if (found) cachedAnchor.copy(anchor);
      cached = true;
      return found;
    },
  };
}
