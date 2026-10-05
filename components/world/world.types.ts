// The town as plain data. The same boxes are drawn, become Rapier colliders, and are carved out of the walking surface.

/** How a district is dressed. */
export type Theme =
  | "lab" | "exec" | "support" | "kitchen" | "front"                         // Ministry of Work campuses
  | "parliament" | "ministry" | "commons" | "plaza"                          // civic
  | "cafe" | "brewery" | "garden" | "pitch" | "neighborhood";                // leisure, sport, homes
/** What a box is. Each kind has one drawing in ./props/. */
export type Kind =
  | "desk" | "counter" | "register" | "board" | "menu" | "rack" | "shelf" | "bookshelf" | "wall"        // work
  | "stove" | "fridge" | "coffee" | "cooler" | "kettle" | "tv" | "arcade" | "sofa" | "table" | "plant"  // rest and food
  | "pdesk" | "podium" | "dome" | "flagpole" | "globe"                                                      // civic
  | "tank" | "barrel" | "taps" | "silo" | "brewsign" | "stool" | "lights"                                  // brewery
  | "tree" | "palm" | "fountain" | "lamp" | "bench" | "car" | "townwall"                                   // outdoors
  | "pitchmark" | "goalpost" | "goalnet" | "crossbar"                                                     // football
  | "bed";                                                                                                  // homes
/** One piece of the town: a footprint (centre x/z, width w along x, depth d along z) and a height h. */
export type Box = {
  kind: Kind; x: number; z: number; w: number; d: number; h: number;
  /** Drawn and collided as a cylinder (w is the diameter). */ round?: boolean;
  /** Owner's colour, or a district's trim. */ accent?: string;
  /** Citizen id, for a desk that lights up while its owner works. */ owner?: string;
  /** Turns the drawing only; walking and physics always use the axis-aligned footprint. */ rot?: number;
  /** Drawn but never in anyone's way (string lights, things overhead). */ decor?: boolean;
};
/** A place to stand and do something, facing `yaw`, with what to call it. */
export type Spot = { label: string; emoji: string; x: number; z: number; yaw: number };
/** A citizen's own place (a desk, or a bed at home) and the district it belongs to. */
export type Seat = { zone: string; x: number; z: number; yaw: number };
/** A district: what it is called and how it is themed, its floor colour, its centre and its size. */
export type Zone = { id: string; name: string; emoji: string; theme: Theme; floor: string; x: number; z: number; w: number; d: number };

/** How a household's home is drawn. Every style shares the same ground footprint, beds and walls. */
export type HouseStyle = "townhouse" | "stilt" | "villa" | "cottage" | "condo";
/** A household's home: footprint centre/size on the ground, storeys, accent colour, style. Everything above the ground is visual only. */
export type House = { x: number; z: number; w: number; d: number; floors: number; accent: string; seed: number; style: HouseStyle };
export type Household = { id: string; name: string; members: string[]; zoneId: string; house?: House };
export type Street = { x: number; z: number; w: number; d: number; kind: "road" | "path" };
export type LifeSpots = Record<"waiting" | "community" | "drinks" | "garden", Spot[]>;
/** The placed town. Seats and homes are keyed by citizen id; every coordinate is in metres from the town centre. */
export type World = {
  zones: Zone[]; boxes: Box[]; streets: Street[]; households: Household[];
  seats: Map<string, Seat>; homes: Map<string, Seat>;
  /** Places to stand: points of interest, daily-life spots by purpose, and the chairs in Parliament. */ pois: Spot[]; lifeSpots: LifeSpots; meeting: Spot[];
  /** Overall width (x) and depth (z). */ w: number; d: number;
};

/** One district before it is placed: coordinates are local to its own centre. */
export type Built = { w: number; d: number; boxes: Box[]; seats: [string, Seat][]; homes: [string, Seat][]; pois: Spot[]; lifeSpots: LifeSpots; meeting: Spot[]; households: Household[] };
export type Spec = { id: string; name: string; emoji: string; theme: Theme; floor: string; built: Built };
