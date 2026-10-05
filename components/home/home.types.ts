import type { RefObject } from "react";
import type { Group } from "three";
import type { House } from "../world";
import type { Mats } from "./home.materials";

/** What every style component receives: its house, the never-fading `base` set, and the fading `upper` set + group. */
export type StyleProps = { house: House; base: Mats; upper: Mats; upperRef: RefObject<Group | null> };
