# Design — Arra / Common Ground

## Source of truth
- Status: Active. Last refreshed: 2026-10-02.
- Primary surface: Lab 01 V2, local Oracle town at port3301.
- Evidence: `components/Hud.tsx`, `TownMap.tsx`, `store.ts`, `Office.tsx`, `app/globals.css`, `TOWN-PLAN.md`, earlier desktop capture `test-results/town-citizens-desktop.png`.
- Current direction supersedes the charcoal/mint office-console brief. V1 remains untouched.

## Brand
- Personality: an illustrated civic field atlas; an artist's map with a gamer's navigation grammar.
- Name: **ARRA / COMMON GROUND**. This is the town's visual identity, not a rename of the Oracle/runtime.
- Trust: literal source health, timestamp, read-only seal and simulation labels.
- Avoid: BotOffice toolbar silhouette, dark dashboard rails, neon pills, pretend money/XP/happiness, claims that cosmetic residents are human identities.

## Product goals
- Orient in the town, notice agents needing input, travel to districts, inspect a citizen and optionally read terminal snapshots.
- Give the HUD a different composition, typography, color system and interaction hierarchy from the inspiration.
- Non-goals: world-engine rewrite, mutation controls, actual Sims relationships/economy, public deployment.
- Success: all existing safe controls retained; attention is actionable; empty/offline is honest; 3D stays the dominant surface.

## Personas and jobs
- Oracle operator: see who is working or waiting; locate the correct citizen; inspect provenance.
- Curious observer: explore work, homes, community and café without triggering commands.
- Desktop keyboard and smaller touch displays; all views remain loopback-only.

## Information architecture
- Town masthead and source-aware population counters at the top.
- A small attention card prioritizes real `blocked` status (not inferred from text).
- Bottom travel deck: numbered district destinations with names, plus town overview.
- Field atlas minimap is collapsible; residents, journal and settings are mutually exclusive field-book panels.
- Citizen dossier replaces a generic infrastructure inspector; real telemetry precedes explicitly simulated life.
- Shortcuts: R residents, J journal, M atlas, T terminal bubbles, 1–7 districts, Escape close. Never intercept typing, modifiers or repeat keys.

## Design principles
1. World first: floating islands, not a full-width app bar or permanent side rails.
2. Artist's materials: warm parchment, navy ink, restrained coral stamps, serif titles and line illustrations.
3. Gamer's loop: notice → travel → select → inspect. No decorative controls pretending to do something.
4. Truth before fiction: preserve Unknown/Offline; label life and project households as simulated.
- Tradeoff: a calm atlas rather than a dense operations console; detailed service diagnostics live in the field book.

## Visual language
- Color: paper `#f6f0df`, ink `#223d4b`, coral `#b9472d`, blue `#35649c`, muted `#596963`; solid readable surfaces over the 3D scene.
- Typography: system sans for data, Georgia serif for editorial titles, system monospace for keys/provenance; no new font/network dependencies.
- Layout: 8px rhythm, 24px desktop safe inset, 12px mobile, 44px minimum primary control targets.
- Shape: bounded paper cards, offset ink shadow, rule lines, hand-drawn SVG town crest. No borrowed logos.
- Motion: short panel entrance only, respects reduced-motion; existing continuous 3D simulation unchanged.
- Imagery: existing licensed Kenney citizens; custom local vector insignia and district glyphs.

## Components
- Reuse store, source adapters, existing Icon, camera manual/auto paths, terminal safety logic.
- Replace Hud chrome, TownMap presentation and CSS rather than piling up override layers.
- `lib/hud.ts` owns pure derived counts/filter/attention/shortcut classification; store owns panel and filter selection.
- States: loading, empty, partial source failure, preview, connected, selected, unmatched search, disabled refresh/terminal preview.

## Accessibility
- Target WCAG AA color contrast/readability; keyboard operation and visible focus. No compliance certification claimed.
- Every panel has a heading and close control; launchers expose expanded state; no offscreen focusable hidden drawers.
- Non-modal floating panels: no fake dialog or unnecessary focus trap. Escape closes and returns to the launcher.
- Keep text status alongside color. Announce connection/problem state, not continuously changing terminal contents.
- No shortcut interception in inputs, selects, textareas or contenteditable.
- Sound off by default. Motion preference affects HUD, not physics.

## Responsive behavior
- Desktop >1000: masthead left, census right, attention left, atlas lower left, travel deck bottom, one field book right.
- Tablet: condensed census; atlas can expand on demand; all controls remain available.
- Mobile <=720: compact top identity, horizontally scrollable labeled travel deck, field books in a bounded bottom sheet, atlas hidden until requested. Retain read-only and preview provenance.
- Landscape/short heights: bounded scrolling panels; hide decorative tagline, never source truth or close buttons.

## Interaction states
- Loading: explicit source-checking label, no fabricated resident count.
- Empty: complete town remains visible; source setup in residents/settings; demo offered but never enabled automatically.
- Error/offline: show per-source diagnostics and last-known offline citizens; never label connectivity as productive activity.
- Success: source counts and observed lifecycle. Attention card disabled when no blocked citizen.
- Preview: persistent synthetic label; terminal captures disabled; returning live clears synthetic state.

## Content voice
- Warm and direct: Residents, Field notes, Visit, Citizen dossier, Source signal.
- Use 'needs input' for blocked; do not call unknown/offline 'sleeping' without the simulated qualifier.
- No invented completion progress, urgency or successful writes.

## Implementation constraints
- Existing Next/React/Three/Zustand stack; no dependencies added.
- Fixed read-only loopback routes and server-only tokens remain unchanged.
- Minimap updates once per second; no second 3D scene for avatar portraits.
- Tests: baseline before edits; pure HUD logic; rendered component contract checks; typecheck/build; live HTTP boundary checks.
- Browser task space19 is user-owned. Do not reclaim it or use another browser. New visual/interactive acceptance remains pending unless control is explicitly returned.

## Open questions
- [ ] Final artist/gamer visual acceptance on desktop/mobile requires browser control returned by the user.
- [ ] Extended simulation accessibility (pause 3D, not just CSS motion) is outside this HUD revision.
