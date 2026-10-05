// The civic districts: Parliament, Ministry of Federation, the Petition office and the Ministry of Community's square.
import type { Built } from "./world.types.ts";
import { backWall, blank } from "./world.parts.ts";

/** Petition office: blocked agents wait here for a human's input. */
export function commons(capacity: number): Built {
  const count = Math.max(30, capacity), cols = Math.ceil(Math.sqrt(count)), rows = Math.ceil(count / cols);
  const out = blank(Math.max(13, cols * 1.8 + 3), Math.max(10, rows * 1.8 + 4)); backWall(out);
  out.boxes.push({ kind: "board", x: 0, z: -out.d / 2 + .75, w: 2.8, d: .22, h: 1.65 }, { kind: "sofa", x: -4.6, z: out.d / 2 - .8, w: 2.1, d: .85, h: .75 }, { kind: "sofa", x: 4.6, z: out.d / 2 - .8, w: 2.1, d: .85, h: .75 });
  for (let i = 0; i < count; i++) out.lifeSpots.waiting.push({ x: -(cols - 1) * .9 + (i % cols) * 1.8, z: -(rows - 1) * .9 + Math.floor(i / cols) * 1.8, yaw: Math.PI, label: "Waiting for input", emoji: "✋" });
  return out;
}

/** Parliament: a hemicycle of member desks facing the speaker's podium, under a dome on the back wall.
 *  Team meetings are parliament sittings. Desks are small axis-aligned boxes so walking still works. */
export function parliament(): Built {
  const out = blank(15, 11.5); backWall(out, "#c9a35a");
  const podiumZ = -out.d / 2 + 1.9;
  out.boxes.push({ kind: "dome", x: 0, z: -out.d / 2 + .7, w: 4.2, d: 1.1, h: 3.6 }, { kind: "podium", x: 0, z: podiumZ, w: 1.3, d: .7, h: 1.1 });
  out.boxes.push({ kind: "flagpole", x: -2.9, z: -out.d / 2 + .7, w: .2, d: .2, h: 3.2, owner: "nation" }, { kind: "flagpole", x: 2.9, z: -out.d / 2 + .7, w: .2, d: .2, h: 3.2, owner: "nation" });
  for (const [r, n] of [[3.0, 7], [4.35, 9], [5.7, 11]] as const) for (let i = 0; i < n; i += 1) {
    const a = -1.2 + 2.4 * i / (n - 1), x = Math.sin(a) * r, z = podiumZ + Math.cos(a) * r;
    if (z > out.d / 2 - .5 || Math.abs(x) > out.w / 2 - .5) continue;
    out.boxes.push({ kind: "pdesk", x: Math.sin(a) * (r - .55), z: podiumZ + Math.cos(a) * (r - .55), w: .62, d: .4, h: .72, rot: a + Math.PI, accent: n === 7 ? "#c9a35a" : n === 9 ? "#a9564a" : "#4f6f8f" });
    out.meeting.push({ x, z, yaw: a + Math.PI, label: "Sitting in parliament", emoji: "🏛️" });
  }
  return out;
}

/** Ministry of Federation: a globe in the hall and a flag for every machine in the herdr federation. */
export function federationMinistry(): Built {
  const out = blank(13, 9.5); backWall(out, "#5b7fa6");
  out.boxes.push({ kind: "globe", x: 0, z: -out.d / 2 + 1.7, w: 1.7, d: 1.7, h: 2.3, round: true });
  for (let i = 0; i < 8; i += 1) out.boxes.push({ kind: "flagpole", x: -4.9 + i * 1.4, z: out.d / 2 - .8, w: .2, d: .2, h: 2.9, owner: `node:${i}` });
  for (let i = 0; i < 8; i += 1) out.lifeSpots.community.push({ x: -3.9 + i % 4 * 2.6, z: -.2 + Math.floor(i / 4) * 1.9, yaw: Math.PI, label: "Visiting the Ministry of Federation", emoji: "🌐" });
  return out;
}

/** Ministry of Community: the square with its fountain. */
export function plaza(): Built {
  const out = blank(14, 11); out.boxes.push({ kind: "fountain", x: 0, z: 0, w: 2.6, d: 2.6, h: .7, round: true }, { kind: "lamp", x: -5.5, z: -4, w: .25, d: .25, h: 2.3 }, { kind: "lamp", x: 5.5, z: -4, w: .25, d: .25, h: 2.3 });
  for (let i = 0; i < 16; i += 1) { const a = i / 16 * Math.PI * 2, r = i % 2 ? 4.2 : 3.3; out.lifeSpots.community.push({ x: Math.sin(a) * r, z: Math.cos(a) * r, yaw: a + Math.PI, label: "Visiting the plaza", emoji: "🏙️" }); }
  return out;
}
