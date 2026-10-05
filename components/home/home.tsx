"use client";
// Ministry of Home: every household's home, drawn in its own style. Only ground walls are layout boxes;
// all of this is visual and fades out of the camera's way (see home.fade).
import { memo, type ComponentType } from "react";
import type { Household, House, HouseStyle } from "../world";
import { useHome } from "./home.fade";
import type { StyleProps } from "./home.types";
import { TownhouseHome } from "./home.townhouse";
import { StiltHome } from "./home.stilt";
import { VillaHome } from "./home.villa";
import { CottageHome } from "./home.cottage";
import { CondoHome } from "./home.condo";

const STYLES: Record<HouseStyle, ComponentType<StyleProps>> = { townhouse: TownhouseHome, stilt: StiltHome, villa: VillaHome, cottage: CottageHome, condo: CondoHome };

function Home({ house, members }: { house: House; members: string[] }) {
  const { base, upper, upperRef } = useHome(house, members), Style = STYLES[house.style];
  return <group position={[house.x, 0, house.z]}><Style house={house} base={base} upper={upper} upperRef={upperRef} /></group>;
}

export const Homes = memo(function Homes({ households }: { households: Household[] }) {
  return <>{households.map(household => household.house && <Home key={household.id} house={household.house} members={household.members} />)}</>;
});
