// Walking. Every citizen (and you, when you walk) is an agent in a Detour crowd on a navmesh baked from the
// layout, so paths go around furniture and walkers make room for each other. Drawing follows the crowd.
import { Crowd, NavMeshQuery, init, type CrowdAgent, type NavMesh } from "recast-navigation";
import type { Activity, GroupView } from "@/lib/hub";
import type { OracleBot } from "@/lib/fleet-types";
import type { LifeDestination } from "../lib/life.ts";
import type { World } from "./world.ts";
import { bakeNavMesh } from "./walk/walk.mesh.ts";
import { goalFor, type Claims, type Goal } from "./walk/walk.goals.ts";

export type { Goal };
/** A walker as drawn: where it is, which way it faces, how fast it moves, and where it is headed. */
export type Rt = { x: number; z: number; yaw: number; speed: number; arrived: boolean; goal: Goal; stuckFor: number };

const STEP = 1 / 30;                    // the crowd advances in fixed 30 Hz steps
const SETTLE = .35, DRIFT = .8;        // reach a spot within 35 cm; walk back if pushed 80 cm away
const STUCK = 2.5;                      // seconds barely moving before asking for a fresh path
const CITIZEN = { radius: .48, height: 1.4, maxSpeed: .85, maxAcceleration: 3.5, collisionQueryRange: 3, pathOptimizationRange: 10, separationWeight: 2 };
const VISITOR = { ...CITIZEN, radius: .4, maxSpeed: 7, maxAcceleration: 30, separationWeight: 0, updateFlags: 0 }; // you: no avoidance, or it fights your keys
const turnToward = (from: number, to: number, rate: number) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * Math.min(1, rate);

export class Nav {
  /** Every citizen's walker, by fleet id. */
  readonly rts = new Map<string, Rt>();
  private agentOf = new Map<string, CrowdAgent>();
  private visitor?: { agent: CrowdAgent; rt: Rt; route?: { x: number; z: number } };
  private drafted = new Set<string>(); // called up by a game (football): they follow it, not their routine
  private closed = false;                // after destroy() a late frame must not touch freed WASM memory

  private world: World;
  private mesh: NavMesh;
  private crowd: Crowd;
  private query: NavMeshQuery;

  private constructor(world: World, mesh: NavMesh, crowd: Crowd, query: NavMeshQuery) {
    this.world = world; this.mesh = mesh; this.crowd = crowd; this.query = query;
  }

  static async create(world: World, bots: OracleBot[], routines = false) {
    await init();
    const mesh = bakeNavMesh(world);
    const nav = new Nav(world, mesh, new Crowd(mesh, { maxAgents: Math.max(64, bots.length + 8), maxAgentRadius: .7 }), new NavMeshQuery(mesh));
    const claims: Claims = new Map();
    for (const bot of [...bots].sort((a, b) => a.id.localeCompare(b.id))) {
      const goal = goalFor(world, bot, routines ? Date.now() : 0, claims);
      if (!goal) continue;
      const at = nav.onMesh(goal.x, goal.z);
      nav.agentOf.set(bot.id, nav.crowd.addAgent(at, CITIZEN));
      nav.rts.set(bot.id, { x: at.x, z: at.z, yaw: goal.yaw, speed: 0, arrived: true, goal, stuckFor: 0 });
    }
    return nav;
  }

  /** The nearest walkable point (within 2 m), or the point itself. */
  private onMesh(x: number, z: number) {
    const found = this.query.findClosestPoint({ x, y: 0, z }, { halfExtents: { x: 2, y: 2, z: 2 } });
    return found.success ? found.point : { x, y: 0, z };
  }
  private headTo(id: string, goal: Goal) {
    const rt = this.rts.get(id), agent = this.agentOf.get(id);
    if (!rt || !agent) return;
    Object.assign(rt, { goal, arrived: false });
    agent.requestMoveTarget(this.onMesh(goal.x, goal.z));
  }

  /** Re-decide every citizen's goal: squads that just talked meet in Parliament; everyone else follows status. */
  think(_now: number, bots: OracleBot[], groups: GroupView[], feed: Activity[], routines = false) {
    if (this.closed) return;
    const wall = Date.now(), seats = this.world.meeting.length;
    const talking = new Set(groups.filter(group => feed.some(item => item.groupId === group.id && wall - item.at < 45_000)).flatMap(group => group.members));
    const meeting = bots.filter(bot => talking.has(bot.id) && (bot.status === "idle" || bot.status === "done")).map(bot => bot.id);
    const claims: Claims = new Map<LifeDestination, Set<number>>();
    for (const bot of [...bots].sort((a, b) => a.id.localeCompare(b.id))) {
      const rt = this.rts.get(bot.id);
      if (!rt || this.drafted.has(bot.id)) continue;
      const chair = meeting.indexOf(bot.id);
      const goal = chair >= 0 && seats ? { ...this.world.meeting[Math.floor(chair * seats / meeting.length) % seats], kind: "meet" as const } : goalFor(this.world, bot, routines ? wall : 0, claims);
      if (goal && (goal.kind !== rt.goal.kind || Math.hypot(goal.x - rt.goal.x, goal.z - rt.goal.z) > .05)) this.headTo(bot.id, goal);
    }
  }

  /** Where to draw an agent between crowd steps: its simulated spot moved on by its velocity for the time not yet
   *  simulated. (The library's own interpolation stands still when frames land exactly on the 30 Hz step.) */
  private drawnAt(agent: CrowdAgent) {
    const spot = agent.position(), velocity = agent.velocity();
    const pending = Math.min(STEP, Math.max(0, (this.crowd as unknown as { accumulator?: number }).accumulator ?? 0));
    return { x: spot.x + velocity.x * pending, z: spot.z + velocity.z * pending };
  }

  update(dt: number) {
    if (this.closed) return;
    this.crowd.update(STEP, Math.min(dt, .25));
    if (this.visitor) this.followVisitor(dt);
    for (const [id, agent] of this.agentOf) this.followCitizen(this.rts.get(id)!, agent, dt);
  }

  private followCitizen(rt: Rt, agent: CrowdAgent, dt: number) {
    const at = this.drawnAt(agent), velocity = agent.velocity(), speed = Math.hypot(velocity.x, velocity.z);
    const gap = Math.hypot(at.x - rt.goal.x, at.z - rt.goal.z);
    rt.speed = speed;
    if (rt.arrived && gap > DRIFT) { rt.arrived = false; agent.requestMoveTarget(this.onMesh(rt.goal.x, rt.goal.z)); }
    // Settle the agent on the exact spot too: others steer around agents, so it must be where it is drawn.
    else if (!rt.arrived && gap < SETTLE && speed < .4) { rt.arrived = true; agent.teleport(this.onMesh(rt.goal.x, rt.goal.z)); }
    rt.stuckFor = !rt.arrived && speed < .1 ? rt.stuckFor + dt : 0;
    if (rt.stuckFor > STUCK) { rt.stuckFor = 0; agent.requestMoveTarget(this.onMesh(rt.goal.x, rt.goal.z)); } // jammed in an aisle: new corridor
    const ease = rt.arrived ? Math.min(1, dt * 4) : 1, aim = rt.arrived ? rt.goal : at;
    rt.x += (aim.x - rt.x) * ease; rt.z += (aim.z - rt.z) * ease;
    rt.yaw = turnToward(rt.yaw, speed > .15 ? Math.atan2(velocity.x, velocity.z) : rt.arrived ? rt.goal.yaw : rt.yaw, dt * 8);
  }

  private followVisitor(dt: number) {
    const visitor = this.visitor!, at = this.drawnAt(visitor.agent), velocity = visitor.agent.velocity();
    Object.assign(visitor.rt, { x: at.x, z: at.z, speed: Math.hypot(velocity.x, velocity.z) });
    if (visitor.route && Math.hypot(at.x - visitor.route.x, at.z - visitor.route.z) < SETTLE) this.stopVisitor();
    if (visitor.rt.speed > .15) visitor.rt.yaw = turnToward(visitor.rt.yaw, Math.atan2(velocity.x, velocity.z), dt * 12);
  }
  private stopVisitor() {
    const visitor = this.visitor;
    if (!visitor) return;
    visitor.route = undefined; visitor.agent.maxSpeed = VISITOR.maxSpeed;
    visitor.agent.requestMoveVelocity({ x: 0, y: 0, z: 0 });
  }

  // ---- you, walking (H) ----
  spawnPlayer(x: number, z: number): Rt | undefined {
    if (this.closed) return undefined;
    if (this.visitor) return this.visitor.rt;
    const at = this.onMesh(x, z);
    const rt: Rt = { x: at.x, z: at.z, yaw: Math.PI, speed: 0, arrived: false, stuckFor: 0, goal: { x: at.x, z: at.z, yaw: Math.PI, kind: "life", label: "Walking around", emoji: "🧍" } };
    this.visitor = { agent: this.crowd.addAgent(at, VISITOR), rt };
    return rt;
  }
  get playerRt() { return this.visitor?.rt; }
  get playerTarget() { return this.visitor?.route; }
  /** Keys: a ground velocity in m/s. Keys cancel a click route; no keys leave a route running. */
  steerPlayer(vx: number, vz: number) {
    const visitor = this.visitor;
    if (this.closed || !visitor || (!vx && !vz && visitor.route)) return;
    if (visitor.route) { visitor.route = undefined; visitor.agent.maxSpeed = VISITOR.maxSpeed; }
    visitor.agent.requestMoveVelocity({ x: vx, y: 0, z: vz });
  }
  /** Click to walk: a path to (x, z) at walking pace, or running. */
  walkPlayerTo(x: number, z: number, run = false) {
    const visitor = this.visitor;
    if (this.closed || !visitor) return;
    const at = this.onMesh(x, z);
    visitor.agent.maxSpeed = run ? 6.5 : 2.2;
    visitor.agent.requestMoveTarget(at);
    visitor.route = { x: at.x, z: at.z };
  }
  /** Fast travel: stand still at (x, z), facing `yaw`. */
  teleportPlayer(x: number, z: number, yaw: number) {
    const visitor = this.visitor;
    if (this.closed || !visitor) return;
    const at = this.onMesh(x, z);
    visitor.agent.teleport(at); this.stopVisitor();
    Object.assign(visitor.rt, { x: at.x, z: at.z, yaw, speed: 0 });
  }
  removePlayer() { if (this.closed || !this.visitor) return; this.crowd.removeAgent(this.visitor.agent); this.visitor = undefined; }

  // ---- games (football) ----
  /** Call a citizen up to run to (x, z) at `speed`, facing `yaw`. Call again whenever the target moves. */
  draft(id: string, x: number, z: number, yaw: number, speed = 2.6, label = "Playing football (simulated)") {
    const rt = this.rts.get(id), agent = this.agentOf.get(id);
    if (this.closed || !rt || !agent) return;
    if (!this.drafted.has(id)) { this.drafted.add(id); agent.updateParameters({ maxSpeed: speed, maxAcceleration: 9 }); }
    Object.assign(rt, { arrived: false, goal: { x, z, yaw, kind: "life", label, emoji: "⚽" } satisfies Goal });
    agent.requestMoveTarget(this.onMesh(x, z));
  }
  /** Put a drafted citizen (or you: id "player") straight onto a spot, e.g. for a kickoff. */
  place(id: string, x: number, z: number) {
    const target = id === "player" ? this.visitor : this.agentOf.has(id) ? { agent: this.agentOf.get(id)!, rt: this.rts.get(id)! } : undefined;
    if (this.closed || !target) return;
    const at = this.onMesh(x, z);
    target.agent.teleport(at); target.rt.x = at.x; target.rt.z = at.z;
  }
  /** Back to the routine; the next think() sends them where their status says. */
  release(id: string) {
    const agent = this.agentOf.get(id);
    if (this.closed || !agent || !this.drafted.delete(id)) return;
    agent.updateParameters({ maxSpeed: CITIZEN.maxSpeed, maxAcceleration: CITIZEN.maxAcceleration });
  }

  destroy() {
    if (this.closed) return;
    this.closed = true;
    this.crowd.destroy(); this.query.destroy(); this.mesh.destroy();
  }
}
