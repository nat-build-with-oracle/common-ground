import { Vector3 } from "three";

/** Where the camera is looking, published by the Director every frame (also while you orbit by hand).
 *  Visual-only scenery reads it to get out of the way of the shot. */
export const lookAt = { target: new Vector3(), active: false };
