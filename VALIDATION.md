# V2 validation — 2026-10-02

## Automated
- `npm ci`: lockfile installs; zero vulnerabilities reported.
- `npm run check`: 10/10 regression tests passed; TypeScript passed.
- `npm run build`: optimized production build passed; only `/`, `/_not-found`, and GET `/api/fleet` are listed.
- `node tests/http.mjs`: fleet GET 200 with `readOnly: true`; POST fleet 405; old send/events 404; cross-site Origin and Sec-Fetch-Site requests 403.
- Adapter tests cover actual MAW envelope and legacy array shape, session status enrichment, Herdr blocked/done states, base36 targets, shell exclusion, unknown lifecycle, loopback restrictions, fixed GET-only calls, server-token non-disclosure, partial/auth failures, empty vs malformed vs unreachable services, and separate synthetic preview.
- Mechanical UI detector: `[]` (no findings).

## Browser
Using ego-browser, checked desktop 1440×1000 and mobile 390×844:
- Nine preview robots load with live navigation and preserved 3D models.
- Search selects glyph-oracle and opens its metadata inspector.
- Needs input filter returns the blocked preview Oracle; mobile drawer closes on selection.
- Preview/read-only labels and the preview switch remain visible on mobile.
- Six physical balls appear from Rain; local scene controls work.
- Switching preview off restores actual source state and removes synthetic bots.
- No horizontal overflow on mobile; no recorded JS errors during tested interactions.
- Final valid captures are in ignored `test-results/desktop.png` and `test-results/mobile.png`.

## Actual services at validation time
- MAW `http://127.0.0.1:3456`: connected, zero agents and empty sessions.
- Herdr `http://127.0.0.1:3457`: unavailable. Authentication/full real Herdr lifecycle could not be exercised against a running daemon; its exact local source contract and fixtures were tested instead.
- No daemon was started, no token was discovered, and no agent/pane was controlled.

## Limits
Polling is every five seconds, not a real-time audit stream. Only explicit lifecycle values are mapped; absent state remains Unknown. Read-only local origins only. No automated upstream 70-second crowd collision acceptance run was claimed. The 3D simulation remains animated under reduced-motion CSS. No separate ESLint configuration exists. (2026-10-05: the BotOffice-derived foundation was rewritten from scratch; the repository is MIT licensed.)

## Independent review
APPROVE / SHIP: no material code or safety findings. Reviewer reran all 10 tests, TypeScript, HTTP boundary checks, and production dependency audit (zero vulnerabilities). LSP diagnostics were unavailable; clean TypeScript diagnostics were used instead.

---

# Town + CC0 model revision — supersedes the earlier V2 result

## Fresh evidence
- `npm run check`: **23/23 tests passed**, TypeScript clean.
- `npm run build`: optimized production build passed, includes `/api/fleet` and `/api/terminal`.
- `node tests/http.mjs`: fixed GET/read-only boundaries passed, arbitrary targets and >4 IDs rejected, cross-site captures denied, no mutation routes.
- Live capture through the viewer returned `status: live`, 480 characters in one recorded probe (content not logged).
- GLB, PNG texture and license HTTP requests all returned 200. Asset tests cover all 18 models, required clips and relative texture existence.
- Native Recast test builds a 52-agent town, verifies status destination categories, simulates motion, switches all agents to work then home, and passes without invalid coordinates.
- Camera projection tests cover landscape, tall/portrait and mobile aspect ratios including empty-world bounds.
- Herdr decimal capture target regression failed against the old base36 implementation, then passed after correction. Real service index34 capture: decimal target200, old base36 target400.

## Browser evidence (ego-browser task space19)
- Desktop town rendered 52 real Herdr agents with 52 navigation runtimes and no reported app error.
- 17 distinct character GLBs/textures were loaded for the 52-agent roster; runtime counted312 textured model meshes (6 per citizen).
- Captured `test-results/town-citizens-desktop.png` shows the full town, textured cartoon citizens, minimap, and live terminal thought clouds.
- Sample after load: 61 requestAnimationFrame callbacks in1015ms. This is a single local sample, not a performance guarantee.
- Initial missing-texture errors were reproduced visually, corrected by vendoring all relative PNGs, then asset existence tests and successful runtime texture loading verified the repair.
- The user took browser control before the planned tall/mobile and empty-roster interactive rerun. Browser actions stopped immediately. Those visual checks remain unverified for this revision; older preview screenshots are not substitutes. No attempt was made to reclaim or finish the user-owned browser space.

## Current external-service limitation
A real Herdr service reported52 agents and successful captures during testing, then its port3457 listener stopped before the final HTTP pass. The inspected process had been launched with `--demo`; that mode has a default30-minute lifetime. At the last probe MAW remained connected/empty and Herdr was offline. No server/pane was restarted or reconfigured during this revision. An already-open viewer retains known offline citizens and sends them home; a fresh reload has no live agents until a source reports them again. A persistent authenticated source URL is pending from the operator.

## Scope / remaining risks
- This is a town visualization, not a full Sims game (no construction economy, autonomous relationships or saved life progression).
- Family/households and off-duty actions are simulation; real status is never inferred from them.
- Terminal updates are bounded HTTP polling (~2-second delay between batches), not PTY streaming; four watched citizens maximum. Plain-text redaction is best effort only. Keep the viewer local.
- No new dependency or separate ESLint configuration. Full-population long-duration collision/congestion and all-device visual acceptance remain future checks.
- Character assets are CC0. (2026-10-05: the BotOffice-derived foundation has since been rewritten from scratch; the repository is MIT licensed.)

---

# Common Ground HUD / oversized crest repair — 2026-10-02

## Root cause and repair
The user screenshot showed the new town crest filling the viewport. New `Hud.tsx` markup had reached the dev server before the old office stylesheet was replaced. The old CSS had no `.town-crest` dimensions or new HUD layout selectors. This was an incomplete change, not a WebGL/model problem.

- Added intrinsic SVG `width=56 height=63` as a sizing fallback.
- Replaced the inherited dashboard stylesheet with a matching paper/ink field-atlas layout; the crest has explicit width, height, max-width and non-growing flex basis.
- `.scene-stage` now fills the viewport; HUD islands have explicit bounded positions. Mobile/short-height adaptations are included but not newly browser-verified.
- Retained controls in residents, notes, settings, citizen dossier and seven district travel destinations. V1 is unchanged.
- Added four pure HUD logic tests and three actual-component render contract tests. Render tests use the real vanilla Zustand store with direct selectors (not browser subscriptions), and stub browser-only audio. They do not prove hydration or visual layout.
- Added a live HTTP check that fetches the page's bundled CSS and verifies the bounded crest and matching new layout selectors.

## Fresh evidence / inline Auditor pass
- `npm run check`: **30/30 tests passed**, TypeScript clean.
- `npm run build`: optimized production build passed.
- Live served CSS contains `.town-crest` max-width56px, `.town-masthead`, `.field-book`, `.travel-deck` and full-canvas `.scene-stage`.
- `node tests/http.mjs`: fleet/capture GET boundaries, no mutation routes, cross-site denial and served stylesheet gates passed.
- Last live HTTP probe: MAW connected/0; Herdr connected/52; terminal snapshot live/510 characters (content not logged).
- No new browser screenshot was captured: task space19 remains user-owned. The supplied screenshot is the failure evidence, not repair evidence. No attempt was made to reclaim control or switch browsers.
- No new dependency. No separate ESLint configuration exists; TypeScript and production build are the static checks.

## Service branch
The installed `maw herdr serve` does not recognize `--rw`; `--demo` is tokenless, read-only and expires. A separate owner-only token was created at `~/.maw/arra-town-herdr.token`, with matching server-only `.env.local` (ignored). An authenticated loopback listener was launched as a supported write-capable alternative, but it did not persist. The later successful fleet/capture probes used a different existing process (PID56566), whose command was verified as `serve --demo`; unauthenticated `/api/sessions` returned200. That live daemon is read-only, not a successful `--rw` activation, and was left untouched. The town remains GET-only. No terminal commands were sent. Persistent write-capable serving is still unresolved.
