import { guard } from "@/lib/guard";
import { cachedFleet } from "@/lib/fleet-server";
import { readFullTerminal } from "@/lib/terminal-full";

export const dynamic = "force-dynamic";
/** One citizen's full visible screen, read-only. `?id=<fleet id>` only; nothing else is accepted. */
export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const url = new URL(request.url), origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== url.origin)) return new Response("forbidden", { status: 403 });
  const ids = url.searchParams.getAll("id");
  if (ids.length !== 1 || !ids[0] || ids[0].length > 500 || [...url.searchParams.keys()].some(key => key !== "id")) return new Response("Provide exactly one current fleet id", { status: 400 });
  const terminal = await readFullTerminal(ids[0], await cachedFleet());
  return Response.json({ ...terminal, readOnly: true, intervalMs: 1000 }, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
