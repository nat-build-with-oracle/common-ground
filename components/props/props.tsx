"use client";
// Furniture for every layout box, looked up by kind. One file per family: office, town, brewery, nation.
import { memo, type ComponentType } from "react";
import type { Box, Kind } from "../world";
import type { P } from "./props.parts";
import { Arcade, Board, Coffee, Cooler, Desk, Fridge, KitchenCounter, Plant, Rack, Register, Shelf, Sofa, Stove, Table, Tv, Wall } from "./props.office";
import { Bed, Car, Fountain, Lamp, Palm, Tree } from "./props.town";
import { Barrel, Bench, BrewSign, Kettle, Lights, Silo, Stool, Tank, Taps } from "./props.brewery";
import { Crossbar, GoalNet, GoalPost, PitchMark } from "./props.sport";
import { Dome, Flagpole, Globe, MemberDesk, Podium } from "./props.nation";

/** Kinds missing here draw nothing (e.g. "townwall": the home components draw those walls). */
const DRAW: Partial<Record<Kind, ComponentType<P>>> = {
  desk: Desk, counter: KitchenCounter, register: Register, wall: Wall, stove: Stove, fridge: Fridge, sofa: Sofa,
  shelf: Shelf, bookshelf: Shelf, tv: Tv, plant: Plant, table: Table, board: Board, menu: Board, coffee: Coffee,
  cooler: Cooler, rack: Rack, arcade: Arcade,
  bed: Bed, tree: Tree, fountain: Fountain, lamp: Lamp, car: Car, palm: Palm,
  tank: Tank, barrel: Barrel, taps: Taps, kettle: Kettle, silo: Silo, bench: Bench, lights: Lights, stool: Stool, brewsign: BrewSign,
  flagpole: Flagpole, globe: Globe, dome: Dome, podium: Podium, pdesk: MemberDesk,
  pitchmark: PitchMark, goalpost: GoalPost, goalnet: GoalNet, crossbar: Crossbar,
};

export const Props = memo(function Props({ boxes }: { boxes: Box[] }) {
  return <>{boxes.map((b, i) => { const Draw = DRAW[b.kind]; return Draw ? <Draw key={i} b={b} /> : null; })}</>;
});
