# ADR-0003 — A pure core, with the boundary enforced by lint

- **Status:** accepted
- **Date:** 2026-10-16
- **Phase:** 0

## Context

SPEC §4 specifies `src/core/` as "pure TS, no DOM" and asks for "ESLint with an
import-boundary rule". SPEC §4 also notes the UI "is a thin shell, so it could
be replaced later without touching the core".

That only stays true if the boundary is checked. The valuable work here — the
24 validator checks, the form generator, the parser, the impact analysis — is
exactly the work that must run in a test process against 1.77 MB of real JSON,
with no browser. One `import { useState }` in a core file ends that.

## Decision

Three layers, dependencies pointing one way only:

```
src/ui       → may import src/core, src/storage
src/storage  → may import src/core
src/core     → may import nothing outside src/core
```

and `src/ui/modules/*` may not import each other.

Enforced in `eslint.config.js` with ESLint's built-in
`no-restricted-imports` (patterns) and `no-restricted-globals`:

- In `src/core/**`: `@ui/**`, `**/ui/**`, `react`, `react-dom`, `@storage/**`,
  `**/storage/**` and **`node:*`** are all errors. The globals `window`,
  `document`, `localStorage`, `indexedDB` and `fetch` are errors.
- In `src/storage/**`: the UI patterns are errors.
- In `src/ui/modules/**`: `../*/**` and `@ui/modules/*/**` are errors.

`tsconfig.app.json` reinforces it from the type side: `src/core` has no
`node` types, so a `node:fs` import does not even typecheck there.

### Why not `eslint-plugin-import`

`import/no-restricted-paths` is the more precise rule — it resolves specifiers
to real paths, so it also catches a relative escape hatch like
`../../../ui/thing`. It needs `eslint-import-resolver-typescript`, which in
this dependency set pulls `eslint-plugin-import-x` and demands
`@typescript-eslint/utils@^8.56` while `typescript-eslint@8.18.2` pins 8.18.2.
`npm install` fails with ERESOLVE.

Resolving that means either unpinning `typescript-eslint` — against SPEC §4's
"pin dependency versions" — or `--legacy-peer-deps`, which hides the next
conflict too. Neither is worth it for a one-user project.

`no-restricted-imports` is built in, needs no resolver, and checks the written
specifier. The gap is relative escapes, which the `**/ui/**` and
`**/storage/**` glob patterns cover for any path that names the directory. The
genuinely uncoverable case — a deeply relative path that never spells `ui` —
is caught by the missing `node` types and by review.

## Consequences

- `src/core` is testable in a Node process with no DOM shim, which is why the
  Phase 0 recon test can load the real 1.77 MB lexicon and finish in 69 ms.
- I/O is injected. The core takes already-parsed data and returns values; the
  filesystem lives in `src/storage` and `scripts/`.
- The core carries no React, so a different UI — or the Tauri shell — is a
  genuine swap.
- Reconsider `eslint-plugin-import` when the peer graph settles; the zones are
  already described in the config comment, so the switch is mechanical.
