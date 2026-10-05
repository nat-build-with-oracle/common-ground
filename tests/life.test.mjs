import { test } from "node:test";
import assert from "node:assert/strict";
import { lifeDestination, stableIndex } from "../lib/life.ts";
import { buildWorld } from "../components/world.ts";

const bot = (id, status, project = `project-${Number(id.slice(1)) % 5}`) => ({
  id, name: `Oracle ${id}`, title: "Codex", color: "#71dec0", sectionId: Number(id.slice(1)) % 2 ? "ops" : "build",
  preview: "", working: status === "working", source: "maw", host: "local", runtime: "codex", pane: id,
  project, status, href: "", seenAt: 1,
});

test("observed statuses map to mandatory town destinations", () => {
  assert.equal(lifeDestination("working", "a", 0), "desk");
  assert.equal(lifeDestination("blocked", "a", 0), "waiting");
  assert.equal(lifeDestination("unknown", "a", 0), "waiting");
  assert.equal(lifeDestination("offline", "a", 0), "home");
});

test("idle and done routines are deterministic and only use explicit simulated places", () => {
  for (const status of ["idle", "done"]) {
    const first = lifeDestination(status, "arra", 90_000);
    assert.equal(lifeDestination(status, "arra", 90_000), first);
    assert.ok(["home", "community", "drinks", "garden", "parliament"].includes(first));
  }
  assert.equal(stableIndex("same", 7, "x"), stableIndex("same", 7, "x"));
  assert.equal(stableIndex("same", 0), -1);
});

test("empty roster still builds a complete town", () => {
  const world = buildWorld([], []);
  for (const id of ["campus", "commons", "meeting", "cafe", "brewery", "plaza", "garden", "neighborhood"]) assert.ok(world.zones.some(zone => zone.id === id), id);
  assert.ok(world.boxes.some(item => item.kind === "bed"));
  assert.ok(world.boxes.some(item => item.kind === "tree"));
  assert.ok(world.streets.length >= 1);
});

test("52 agents receive unique desks and homes while projects form simulated households", () => {
  const statuses = ["working", "blocked", "unknown", "offline", "idle", "done"];
  const bots = Array.from({ length: 52 }, (_, index) => bot(`b${index}`, statuses[index % statuses.length]));
  const world = buildWorld(bots, [{ id: "build", name: "Build campus" }, { id: "ops", name: "Support ops" }]);
  assert.equal(world.seats.size, 52);
  assert.equal(world.homes.size, 52);
  assert.equal(new Set([...world.seats.values()].map(seat => `${seat.x},${seat.z}`)).size, 52);
  assert.equal(new Set([...world.homes.values()].map(seat => `${seat.x},${seat.z}`)).size, 52);
  assert.equal(world.households.length, 5);
  assert.ok(world.households.every(household => household.name.endsWith("household (simulated)")));
  assert.ok(world.w > 30 && world.d > 30);
  assert.ok(world.lifeSpots.waiting.length >= 24);
});

test('off-duty routes are staggered and change much less often than the old 45-second shuffle', () => {
  const ids = Array.from({length: 100}, (_, i) => `citizen-${i}`);
  const changed = ids.filter(id => lifeDestination('idle', id, 0) !== lifeDestination('idle', id, 60_000));
  assert.ok(changed.length < 25, `${changed.length} citizens changed destination together`);
});

test("every household townhouse sits on its own beds, inside the homes district", () => {
  const bots = Array.from({ length: 12 }, (_, i) => ({ id: `o-${i}`, name: `o-${i}`, color: "#71dec0", project: `p-${i % 4}`, status: "idle", working: false, sectionId: "w" }));
  const world = buildWorld(bots, [{ id: "w", name: "Work" }]);
  const zone = world.zones.find(zone => zone.id === "neighborhood");
  for (const household of world.households) {
    const house = household.house;
    assert.ok(house, household.id);
    assert.ok(Math.abs(house.x - zone.x) + house.w / 2 <= zone.w / 2 && Math.abs(house.z - zone.z) + house.d / 2 <= zone.d / 2, `${household.id} outside the district`);
    for (const id of household.members) {
      const seat = world.homes.get(id);
      assert.ok(Math.abs(seat.x - house.x) < house.w / 2 && Math.abs(seat.z - house.z) < house.d / 2, `${id} sleeps outside their house`);
    }
  }
});

test("homes come in several styles: condos for big households, cottages only for small ones", async () => {
  const { houseStyle } = await import("../components/world.ts");
  const bots = Array.from({ length: 40 }, (_, i) => ({ id: `o-${i}`, name: `o-${i}`, color: "#71dec0", project: `p-${i < 6 ? 0 : i}`, status: "idle", working: false, sectionId: "w" }));
  const world = buildWorld(bots, [{ id: "w", name: "Work" }]);
  const styles = new Set(world.households.map(household => household.house.style));
  assert.ok(styles.size >= 3, `only ${[...styles].join(", ")}`);
  for (const household of world.households) {
    if (household.members.length >= 5) assert.equal(household.house.style, "condo");
    if (household.house.style === "cottage") assert.ok(household.members.length <= 2);
  }
  for (let seed = 0; seed < 12; seed += 1) assert.ok(houseStyle(1, seed).floors >= 1 && houseStyle(9, seed).floors >= 4);
});

test("Parliament sits: members attend in the first quarter of each hour, always when routines are off", async () => {
  const { lifeDestination, isMember, inSession } = await import("../lib/life.ts");
  const ids = Array.from({ length: 60 }, (_, i) => `citizen-${i}`), members = ids.filter(isMember);
  assert.ok(members.length > 10 && members.length < 35, `${members.length} members`);
  const sitting = Date.UTC(2026, 9, 3, 14, 5), recess = Date.UTC(2026, 9, 3, 14, 40);
  assert.ok(inSession(0) && inSession(sitting) && !inSession(recess));
  for (const id of members) {
    assert.equal(lifeDestination("idle", id, 0), "parliament");
    assert.equal(lifeDestination("idle", id, sitting), "parliament");
    assert.notEqual(lifeDestination("idle", id, recess), "parliament");
    assert.equal(lifeDestination("working", id, sitting), "desk", "work comes first");
    assert.equal(lifeDestination("blocked", id, sitting), "waiting", "petitions come first");
  }
});
