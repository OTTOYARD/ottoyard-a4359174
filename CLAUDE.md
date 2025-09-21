# CLAUDE.md — OTTOYARD guardrails

## Objective
Implement "OttoCommand AI": the foremost fleet/depots expert that analyzes **internal data** to schedule/optimize operations (charging, staging, detailing, rebalancing). OttoCommand must give **direct, factual answers** when clear, and **creative, expert recommendations** when optimization is needed.

## Tech baseline
- Language: TypeScript (strict)
- Package: npm
- App: React/Next.js or similar SPA + Node functions (keep framework-agnostic in services)
- Tests: Vitest (unit) + Playwright (e2e minimal)
- Lint: ESLint + Prettier

## Architecture rules
- Put callable “agent tools” in `src/agent/tools.ts` (JSON-schema definitions + runtime bindings).
- Put domain logic in `src/services/*.ts` (pure functions, testable).
- Keep data access (mock now) in `src/data/`.
- HTTP/API handlers call services only; no business logic in controllers.
- Types live in `src/types/`.

## Quality gates
- All PRs must include: tests, types, doc updates (README/USAGE).
- No any/implicit any. No unused vars. CI must pass.
- Commit style: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.

## OttoCommand style
- Be decisive: if data is sufficient, answer plainly first; then add reasoning/alternatives.
- If optimization is needed, output: 1) recommended action, 2) supporting metrics, 3) risks/assumptions, 4) follow-up checks.
- Prefer structured outputs (JSON blocks) for the UI to render.

## Initial tasks for PRs
- Scaffold agent tools & mock data
- Charging/Staging Scheduler UI + minimal e2e
- Utilization reports & optimization endpoints
- Input validation + conflict prevention for double-bookings
