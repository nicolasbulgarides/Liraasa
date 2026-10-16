# ADR-0005 — Stack, pinned versions and the test gate

- **Status:** accepted
- **Date:** 2026-10-16
- **Phase:** 0

## Context

SPEC §4 fixes most of this: Vite + TypeScript (strict) + React, Vitest,
ESLint with an import boundary, Prettier, hash-based routing, plain CSS with
custom properties, no heavy UI kit, pinned versions, mature libraries. This ADR
records the specifics chosen inside those constraints and the few judgement
calls.

## Decision

### Versions, pinned exactly

No `^`, no `~`, in either dependency block.

| Package                   | Version |
| ------------------------- | ------- |
| react, react-dom          | 18.3.1  |
| typescript                | 5.7.2   |
| vite                      | 6.0.7   |
| @vitejs/plugin-react      | 4.3.4   |
| vitest                    | 2.1.8   |
| eslint                    | 9.17.0  |
| typescript-eslint         | 8.18.2  |
| eslint-plugin-react-hooks | 5.1.0   |
| prettier                  | 3.4.2   |
| tsx                       | 4.19.2  |

React 18 rather than 19: the ecosystem around it is settled, and the UI is a
thin shell where a major-version jump buys nothing. Revisit when a module
actually wants a 19 feature.

`tsx` is the one addition to SPEC's list, to run the `scripts/` CLIs
(`npm run validate`) as TypeScript without a build step.

### TypeScript: strict, and then some

`strict: true` plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`,
`noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax`.

`noUncheckedIndexedAccess` is the one that matters most here. This codebase
indexes into arrays and record maps constantly — form slots, components,
clause positions, `lookup_0_999`. Making every such read `T | undefined`
forces the missing case into the open, which is exactly right for data where
"this compound has no second component" is a real bug class.

`exactOptionalPropertyTypes` matters for ADR-0002: it keeps "absent" and
"present and undefined" distinct, which is the difference between omitting
`replaces` and emitting `"replaces": null` into the author's canonical file.

Three projects: `tsconfig.app.json` (DOM + React, covers `src` and `tests`),
`tsconfig.node.json` (node types, covers `scripts` and the configs), both
extending `tsconfig.base.json`. `src/core` therefore has no `node` types,
which reinforces ADR-0003 from the type side.

### Hash-based routing

As SPEC §4 requires, and with `base: './'` in the Vite config. Together these
mean the same `dist/` works opened from `file://`, served by any static host,
or loaded in a Tauri window, with no rewrite rules anywhere. A hand-rolled
hash router in `src/ui/app/` — a dozen routes over a `hashchange` listener does
not need a routing library, and skipping one keeps the UI swappable.

### Path aliases

`@core/*`, `@storage/*`, `@ui/*`, declared identically in `tsconfig`, `vite.config.ts`
and `vitest.config.ts`. Deep relative paths are what make import boundaries
unreadable; aliases make a violation obvious on sight as well as to lint.

### The gate

`npm run check` = `typecheck` → `lint` → `format:check` → `test`. One command,
and the one to run before reporting a phase complete.

Vitest runs in the `node` environment and collects `src/**/*.test.ts` and
`tests/**/*.test.ts`. Unit tests sit beside the code; golden tests that read
the real data live in `tests/golden/` with a shared path helper. jsdom is
deliberately absent: there is no UI logic worth testing in Phase 0, and the
core must never need it. Add `environment: 'jsdom'` per-file later if a
component earns a test.

### Design tokens

One palette on bare `:root`, redefined under
`@media (prefers-color-scheme: dark)` guarded as `:root:not([data-theme='light'])`
and again under `:root[data-theme='dark']`, so a future settings toggle wins in
both directions. `--font-liraasa` is a serif stack held separate from
`--font-ui`, per SPEC §12; Liraasa text gets a class, never a transform, so
spelling is never altered for display.

## Consequences

- `npm install` is reproducible; `package-lock.json` is committed.
- Phase 0 state: typecheck clean, lint clean, prettier clean, 21 tests green.
- `docs/SPEC.md` is in `.prettierignore`. It is the author's document and
  Prettier wanted to repad its markdown tables; it is not ours to reformat.
  `data/source/` is ignored for the same reason, and more so.
- Any dependency bump is a deliberate edit to an exact version.
