// The hosted page (town.buildwithoracle.com) has no server of its own. `?host=` names the
// herdr serve your browser should read, the drizzle.studio pattern. Pure, so it is tested.

export type HostChoice = { kind: "none" } | { kind: "host"; origin: string } | { kind: "invalid"; value: string };

/** Accept only a bare http(s) origin: no path, query, fragment or credentials. A missing scheme means http. */
export function parseHost(search: string): HostChoice {
  const value = new URLSearchParams(search).get("host")?.trim();
  if (!value) return { kind: "none" };
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `http://${value}`);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || (url.pathname !== "/" && url.pathname !== "") || url.search || url.hash) return { kind: "invalid", value };
    return { kind: "host", origin: url.origin };
  } catch { return { kind: "invalid", value }; }
}
