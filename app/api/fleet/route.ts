import { guard } from "@/lib/guard";
import { cachedFleet } from "@/lib/fleet-server";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const denied = guard(request);
  if (denied) return denied;
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) {
    return new Response("forbidden", { status: 403 });
  }
  return Response.json(await cachedFleet(), { headers: { "Cache-Control": "no-store" } });
}
