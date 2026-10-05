# HUD prism — artist + gamer DNA (2026-10-02)

## 🔍 Archaeologist — What still belongs to the inspiration?
`Hud.tsx` retained topbar/SceneTools/Roster/Inspector; `globals.css` layered town overrides over the earlier dashboard. Town expansion changed the scene more than the interface. The inherited signature is composition, not merely its green palette.

## 🎨 Artist — What makes this unmistakably ours?
An original 'Common Ground' civic field atlas: paper/ink/coral, expressive serif nameplate, custom town crest, stamped provenance, numbered district tickets. Different silhouette and type hierarchy; no copied logos or external graphic kit.

## 🎮 Gamer — What is the useful play loop?
Notice blocked agents → choose one → camera follows → inspect real status and optional terminal. District hotkeys and a collapsible atlas support traversal. Residents/field notes/settings become a single field book; controls have explicit state and names.

## 💀 Skeptic — Where does the metaphor lie?
A happiness/economy meter would invent data. A quest would imply task orchestration that this viewer cannot perform. Reject both. A 'calm town' claim cannot follow merely from zero agents: show source availability and literal counts. The paper aesthetic may reduce density; retain searchable roster and diagnostics.

## 📋 Auditor — What proves this is done?
Baseline: 23 tests + TypeScript passed before edits. Keep adapters/terminal safety intact. Add derived HUD logic and render/keyboard contract tests, then rerun build and HTTP gates. Browser19 is user-controlled, so no new visual proof may be claimed without explicit return of control.

**Cross-lens summary:** The artist wants a memorable material identity; the gamer wants fast decisions; the skeptic prevents invented telemetry. Implement a world-first field atlas with actionable attention and truthful provenance—not a recolored dashboard.

## Implementation / cleanup plan
1. Lock current baseline (23 tests/typecheck passed).
2. Add tested pure counts, search/filter, blocked-agent cycling and keyboard classification.
3. Replace the HUD composition; retain control effects and source metadata. Consolidate CSS rather than append another override pile.
4. Replace district/minimap presentation with numbered travel deck and foldable atlas.
5. Verify logic/render contracts, typecheck, production build, HTTP boundaries; explicitly separate browser gaps.

Writer/reviewer separation: this document is the design/writer pass. A later inline Auditor pass records acceptance evidence and unresolved issues in VALIDATION.md; it is not an independent-agent review.
