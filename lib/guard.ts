// The local API answers this machine only. Another site cannot read it: the Host header must name a loopback
// address, which defeats DNS rebinding. Nor can it write: a write must come from our own origin, which defeats CSRF.
const LOOPBACK = new Set(["127.0.0.1", "localhost", "[::1]"]);

/** "localhost:3300" → "localhost", "[::1]:3300" → "[::1]"; anything that is not a name with an optional numeric port → "". */
const hostName = (host: string) => /^(\[[^\]]*\]|[^:[\]]+)(?::\d+)?$/.exec(host)?.[1] ?? "";
const forbidden = () => new Response("forbidden", { status: 403 });

/** null when the request may go ahead, otherwise the 403 to send back. Pass `write` for anything that changes state. */
export function guard(request: Request, write = false): Response | null {
  const host = request.headers.get("host") ?? "";
  if (!LOOPBACK.has(hostName(host))) return forbidden();
  if (write && request.headers.get("origin") !== `http://${host}`) return forbidden();
  return null;
}
