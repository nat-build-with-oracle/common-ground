# Arra Town V2
<!-- impeccable:product-schema 1 -->

## Platform
web

## Purpose
A live 3D town for the Oracle fleet, inspired by Bot Office and written from scratch, mapped to the fleet through `maw serve` and `maw herdr serve`. MIT licensed.

## Stack
Next.js / React / Three.js (react-three-fiber, drei) / Rapier / Recast / Zustand, plus xterm for the full-screen terminal.

## Constraints
The first V2 is intentionally a read-only local observer (implementation scope choice). It never submits commands or discovers credentials. The user subsequently requested read-only terminal text above avatars, simulated homes/families/social routines, a larger SimCity-like map, and open-license cartoon models. Preview data must remain visibly synthetic and opt-in; missing live data stays empty/offline.

## HUD identity
Original Common Ground field atlas: artist's paper/ink material language plus gamer's notice → travel → inspect loop. No invented telemetry, economy or completion signals. See DESIGN.md and HUD-PRISM.md.

## Evidence
Pinned upstream source and exact local MAW/Herdr route schemas, documented in README. Live town validation observed MAW connected/empty and 52 Herdr agents with successful terminal capture. The temporary Herdr demo server later stopped; current connectivity is always shown explicitly.

## Open decisions
Real command submission, remote fleet connections, Oracle memory access, and authentication UI are not implemented or implicitly authorized.
