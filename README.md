# Common Ground · Agentic Nation (v3)

A read-only, live 3D view of the Oracle fleet, drawn as a small nation. Real agent status from MAW, Herdr and
the herdr agentic federation; everyday life around it (homes, routines, Parliament sittings) is simulated and labelled as such.

## Run

```sh
npm ci
npm run dev              # http://127.0.0.1:3301
```

Node.js 22.18+ and WebGL required; verified with Node.js 26.

## What is in v3

- **Ministries.** Work (one campus per machine), Home, Community, the Petition office (blocked agents wait for a human),
  **Parliament** (dome, podium, hemicycle; members sit for 15 minutes every hour, simulated) and the
  **Ministry of Federation** (a globe and a flag per federation machine, raised while its link is up). The **Cabinet** (C) counts who is where.
- **Federation.** Every machine joined to the local herdr-federation node gets its own Ministry of Work district.
- **Prime homes** in five styles: Thai townhouse, ruen thai stilt house, villa, cottage, condo (5+ residents).
  Upper floors fade when you look at the homes or follow a resident; windows light up after dark (Bangkok time).
- **A brewery**: brewhouse, grain silo, fermenters, taproom and beer garden; plus a café and a garden.
- **Walk as yourself** (H): WASD, Shift to run, E to say hi (the citizen answers from its observed status), F to throw a ball.
- **Football** (G, or ⌘K → "Play football"): a 3-minute simulated match at the Ministry of Sport. WASD + Shift move you, hold F to charge a kick where you face, E passes. Idle and done citizens play (up to 4 a side, you join the Lanterns); working, blocked, unknown and offline ones never do. Nothing is sent to any agent. Code: `components/game/football/`.
- **⌘K** command palette: any citizen, any place, any action.
- **Full-screen terminal** (Enter on a selected citizen, or ⌘K): the maw-ui god-view layout in xterm.js, **read-only**.
- **Music** (B): a generated score that follows Bangkok's day and night.
- **Themes**: Blocky, Retro, Survivors, Protagonists, Urban (Settings or ⌘K).

## Connect services

The app reads these existing local services; it **does not start, reconfigure, or control them**:

| Source | Default origin | Read endpoints |
|---|---|---|
| `maw serve` | `http://127.0.0.1:3456` | `/api/agents`, `/api/sessions?local=true`, `/api/capture?target=…` |
| `maw herdr serve` | `http://127.0.0.1:3457` | `/api/sessions`, `/api/capture?target=…` |
| herdr-federation node | `http://127.0.0.1:6750` (`FEDERATION_OFFICE_URL`) | `/api/status`, and `POST /api/fleet/pane` to read a remote pane |

Copy `.env.example` to `.env.local` to change origins. They must be loopback HTTP(S) origins. Where a daemon requires authentication, provide `MAW_OFFICE_TOKEN` or `HERDR_OFFICE_TOKEN` explicitly in that local file. These values are **server-only**; never use `NEXT_PUBLIC_` for tokens. Restart the app after changing environment variables.

The correct CLI spelling is **herdr**, not herder. Current Herdr serving syntax is `maw herdr serve --listen 127.0.0.1:3457 --token-file PATH`. The installed version has no `--rw` flag: `--demo` is read-only and expires, while `--token-file` enables authenticated daemon access. The app never reads a token file automatically or enables mutation routes. At the operator's explicit request, a separate local token was generated for a service-start attempt and placed in the ignored server-only `.env.local`; see `VALIDATION.md` for current runtime evidence.

### Mapping rules

- MAW supports the current `{agents, count, node}` envelope and older bare arrays. Session-window status enriches agent records by canonical target. A listed process without explicit lifecycle state is **Unknown**, not Working or Done.
- Herdr sessions retain `working`, `idle`, `blocked`, `done`, and `unknown`. Plain shell panes are excluded. The HTTP API uses decimal pane indices; native Herdr base36 IDs must not be substituted in capture requests. This was verified against the installed plugin and an actual index-34 capture.
- IDs include provider + host + pane, so providers cannot collide. Project displays the GitHub repository name when the cwd reveals one; otherwise only the directory basename. Worktrees are grouped into their parent project household.
- A failing source retains its last-known bots as **Offline**. A healthy empty response removes vanished bots. It never substitutes preview data for a disconnected source.
- Polling is suspended in hidden tabs and in preview mode. Refresh applies only to live mode. A status can change between polls; this is not an audit log.

## Safety boundary

The app exposes **GET `/api/fleet`**, **GET `/api/terminal?id=…`** (thought clouds) and **GET `/api/terminal/full?id=…`** (the full-screen terminal: one current fleet id, redacted, bounded). There is no send, wake, kill, shell-input, SSE or mutation proxy. Captures are restricted to at most four IDs from the current connected roster; the browser cannot supply an upstream URL, target, route or token. Backend requests are fixed GET routes, loopback-only and reject redirects. Fleet reads have an eight-second timeout; captures have 3.5 seconds. Tokens stay on the server. Cross-site requests and non-loopback Host headers are rejected.

Terminal text is private. Captures are ANSI-stripped, length-bounded and rendered as plain text. Common credential patterns are masked as a best effort, **not a privacy guarantee**. Keep this app on loopback; do not expose it publicly or screen-share private terminal text. No terminal content is persisted. The Terminals control disables polling; preview mode never captures terminals. "Open source view" opens the separate daemon application, not a control proxy in this lab.

No Oracle memory or filesystem credentials are automatically discovered. A source may go offline (including a temporary `maw herdr serve --demo` server, which expires after 30 minutes). Last-known citizens in an already-open town go home with an Offline label. Reloading starts from the currently reported roster, not a fabricated population. Empty towns still render all civic districts and working overview controls.

## Verify

```sh
npm run check            # 49 regression tests + TypeScript static analysis
node tests/http.mjs      # running app: GET-only, absent mutation routes, cross-site denial
npm run build
npm start                # production on :3301; stop dev first
```

There is no ESLint config. TypeScript and the production build are the static-analysis gates. The current town revision was checked with TypeScript, unit/navigation/asset tests, HTTP tests, and a production build; there is no separate ESLint command.

## Origin and license

Common Ground is released under the [MIT license](LICENSE).

It started as a study of [Bot Office](https://botoffice.vercel.app/)
([source](https://github.com/jaturapornchai/mybotdemo01/tree/b539632eba4ef28c14cf0e2c0b2ec6c8ee122787/botoffice)),
a playful 3D office where chat bots walk between desks. That project declares no license, so none of its code is
carried here: the scene, walking (Recast crowd), physics (Rapier), sound, furniture and state were rewritten from
scratch for this repository. The idea of an office you can watch your bots live in is theirs. Thank you.

Third-party assets keep their own licenses. The cartoon characters are **CC0**: [Kenney Blocky Characters 2.0](https://kenney.nl/assets/blocky-characters)
and the other Kenney packs below, unmodified, each with its original license, source URL and SHA-256 hashes in `public/models/<pack>/`.

Research used `relic search 'oracle-office-3d'` and `relic search 'maw agora'`, then inspected the existing `oracle-office-3d/src/lib/useCapturePreview.ts` read-only snapshot implementation and current local daemon source. Relic results were historical references, not live roster evidence.

Integration contracts were verified against local source on 2026-10-02:

- `Soul-Brews-Studio/maw-rs/crates/maw-cli/src/serve_core/modules/agent_routes.rs`
- `Soul-Brews-Studio/maw-herdr-plugin/src/serve/bun/mod.serveAPI.ts`
- `Soul-Brews-Studio/maw-herdr-plugin/src/serve/bun/mod.readRoster.ts`
- `Soul-Brews-Studio/arra-office/README.md` (the existing Arra frontend is a renderer for MAW, not the daemon).

Lab adaptation by **glyph-oracle (AI)** for Nat. See `VALIDATION.md` for observed verification and current service limitations.

## HUD design and verification

`DESIGN.md` is the Common Ground design contract; `HUD-PRISM.md` records the artist/gamer review. The oversized-crest repair adds intrinsic SVG dimensions and replaces the old stylesheet rather than layering another dashboard override. Tests cover the rendered sizing contract and the actually served CSS. New browser visual acceptance is still pending because the operator owns browser task space19.

## Themes

Settings → Theme (or ⌘K → "Theme: …") switches the look of the town; the choice is saved in `localStorage` (`office-town:theme`).

| Theme | Citizens | Ground |
|---|---|---|
| Blocky | Kenney Blocky Characters (GLB, 18) | flat colors |
| Retro / Survivors / Protagonists | Kenney Animated Characters (FBX rig + 4 skins, idle/run) | tinted colors |
| Urban | Blocky citizens | Kenney RPG Urban pixel tiles |

All packs are CC0 and vendored under `public/models/<pack>/` with `LICENSE.txt`, `PROVENANCE.md` and `SHA256SUMS`.

## Session URLs

Every citizen has a shareable path: **`/s/<fleet id>`**. The fleet id is the same id `/api/fleet` reports and `/api/terminal` accepts, e.g. `herdr:local:ZGVmYXVsdA/d0Q:34`. It contains `:` and `/`, so the id is percent-encoded with `encodeURIComponent` into one path segment:
```
/s/herdr%3Alocal%3AZGVmYXVsdA%2Fd0Q%3A34
```
- Opening a session URL loads the town, moves the camera to that agent and opens its dossier and terminal view.
- Selecting an agent updates the address bar to its `/s/…` URL; back and forward move between selections.
- An unknown, malformed or offline id shows the town with a notice ("Session not found" / "offline") and selects nobody.
- The id is only ever matched against the current connected roster in the browser; it never becomes an upstream URL, target or token, and no new API route or write path was added. A hand-typed link with a literal `/` in the id also resolves.
Code: `lib/session-url.ts` (encode / parse / roster lookup, covered by `tests/session-url.test.mjs`) and `components/SessionUrl.tsx` (address-bar sync).

## Hosted: town.buildwithoracle.com

A static build of the same town, served by Cloudflare Workers. It has no server: your browser reads
your own `maw herdr serve` named by `?host=` (the drizzle.studio pattern), so fleet data never passes
through Cloudflare.

1. Run herdr serve and allow the site: `maw herdr serve --token-file ~/.maw-herdr-token --listen 127.0.0.1:3457 --allow-origin https://town.buildwithoracle.com`
2. Open `https://town.buildwithoracle.com/?host=http://127.0.0.1:3457` and paste the token (kept in that tab's sessionStorage only, sent only to that host).

An allowed origin can read every pane that server sees. Deploy: `npm run deploy:town` (`OFFICE_HOSTED=1` static export via
`app/*.web.tsx` entries, then `wrangler deploy -c wrangler.town.json`). Hosted mode reads Herdr only (no MAW / federation).

## Federation node safety

The herdr-federation node's own console (`/`, `/api/hey`, `/api/fleet/pane`, …) has no authentication. Started with
`just node start` it listens on every interface (`FED_HOST=0.0.0.0`). This app only reads it over loopback, but anyone
who can reach that port can read panes and type into agents. Keep the port off untrusted networks.

## Code map

One folder per module, one concern per file, named `module.function.ts(x)`:

| Folder | What |
|---|---|
| `components/world/` | the layout as data: `world.work`, `world.civic`, `world.leisure`, `world.homes`, `world.build` |
| `components/props/` | furniture per layout kind: `props.office`, `props.town`, `props.brewery`, `props.nation` |
| `components/home/` | one file per home style, plus `home.fade` (ghosting) and `home.rooms` |
| `components/office/` | the 3D scene layers: sky, rooms, citizens, balls, director (camera), reactor (sound cues) |
| `components/walk/` | walking: `walk.mesh` bakes the navmesh from the layout, `walk.goals` picks where each citizen goes; `crowd.ts` runs the Detour crowd |
| `components/sound/` | synthesized effects (`sound.synth`, `sound.recipes`) and the Thai voice (`sound.voice`) |
| `components/store/` | shared state (`store.state`), live fleet polling (`store.fleet`), activity events, toys |
| `components/hud/` | one file per HUD panel |
| `components/term/`, `palette/`, `music/` | full-screen terminal, ⌘K, music (`music.score` is pure) |

Modules that `node --test` imports directly (world, life, themes, palette items/match, music score) must import
other runtime code with **relative `.ts` paths**, not `@/…`: Node resolves neither the alias nor missing extensions.
