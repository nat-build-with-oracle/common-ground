# V2 town expansion — 2026-10-02

## User outcome
A large Sims/SimCity-like Oracle town: working agents commute to work, non-working agents have distinct spaces, homes / simulated families / sleep / community / drinks, and current read-only terminal text over avatars.

## Evidence / prism findings
- Screenshot exposed an empty-roster camera bug: Director required nav, but nav was not created with zero bots. Fit also ignored aspect ratio. Fix independently of crowd navigation.
- Herdr was temporarily unavailable; fresh direct HTTP and /api/fleet now both return 52 agents. Do not attribute the earlier failure to authentication without evidence.
- Installed Herdr service captures decimal targets: index34 gives HTTP200; base36 `y` gives capture_unavailable. Regression-test actual wire encoding.
- Relic `oracle-office-3d` search found previous office work; local `Soul-Brews-Studio/oracle-office-3d/src/lib/useCapturePreview.ts` polls read-only `/api/capture?target=`, strips ANSI, and bounds visible lines. Reuse the pattern, not send/Enter controls.
- Architect: fixed GET-only localhost adapters are useful. Skeptic/Auditor: earlier passing fixtures and preview screenshots did not prove live fleet usability; the previous completion claim was too broad.

## Boundaries
Real provider lifecycle remains authoritative. Household/family = project-based simulated group, not human kinship. All sleep/social actions are visual simulation, never backend commands. Terminal snapshots stay local, in memory, limited to 4 watched agents; no terminal input, public sharing, or arbitrary target proxy. No new dependencies.

## Sequence / acceptance gates
1. Pure camera math and wire-target regression tests.
2. World + deterministic routine implementation in isolated files; adapter + terminal UI separately.
3. Full-map HUD, zoom-to-district, minimap, simulation provenance.
4. Unit tests, typecheck, production build, localhost API boundary tests.
5. Browser verify real fleet + real terminal, idle/home/work routing, empty fleet, tall and mobile views. Record limitations rather than claiming untested work.
