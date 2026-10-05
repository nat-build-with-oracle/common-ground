import { guard } from "@/lib/guard";
import { cachedFleet } from "@/lib/fleet-server";
import { readTerminal } from "@/lib/terminal-server";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const url = new URL(request.url), origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== url.origin)) return new Response("forbidden", { status: 403 });
  const ids = [...new Set(url.searchParams.getAll("id"))];
  if (!ids.length || ids.length > 4 || ids.some(id => !id || id.length > 500) || [...url.searchParams.keys()].some(key => key !== "id")) {
    return new Response("Provide 1–4 current fleet ids only", { status: 400 });
  }
  const fleet = await cachedFleet();
  const snapshots = await Promise.all(ids.map(id => readTerminal(id, fleet)));
  return Response.json({ snapshots, readOnly: true, intervalMs: 2000 }, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
