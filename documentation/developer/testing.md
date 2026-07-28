# Testing

evitaLab uses [Vitest](https://vitest.dev/) for unit tests.

```bash
yarn test        # runs vitest (watch mode locally, single run in CI)
```

## Layout & conventions

Tests live in the top-level `test/` directory, mirroring the `src/` structure:

```
test/
├── utils/               # tests of src/utils helpers (duration, number, object, uuid, semver…)
├── modules/             # tests of module logic
├── components/          # repository-wide checks over .vue sources (see Slot names below)
└── xxhashjs/            # sanity tests of third-party behaviour we depend on
```

- File naming: `<subject>.test.ts`.
- Use plain `test`/`expect` imports from `vitest`:

```ts
import { test, expect } from 'vitest'
import { parseHumanDurationToMs } from '../../src/utils/duration'

test('Should parse human duration', () => {
    expect(parseHumanDurationToMs('23ms')).toEqual(23n)
})
```

- Test names are human-readable sentences (`'Should parse human duration'`), typically one positive
  and one negative test per behaviour.

## Type checking

The test suite is type-checked, not just transpiled. `tsconfig.vitest.json` (a
composite project covering `src/**` + `test/**`, extending `tsconfig.app.json`)
is referenced from the root solution, so `yarn typecheck` (`vue-tsc -b`) and the
CI typecheck step cover `test/**` under the same strict flags as the app. Tests
must be at **zero** type errors. For test-only casts (private-method access,
deliberately-invalid fixtures) prefer `as unknown as T` over `any`.

## What to test

Current coverage focuses on pure logic: utilities, parsers, model helpers. When you add or fix
logic that does not require a running server or DOM (formatters, converters, query builders,
utility functions), add a unit test with it — **every bug fix in such logic should include a
regression test**.

UI components and server-dependent flows are currently verified manually against a running evitaDB
instance (see [running development version](running-development-version.md) and
[evitaDB server](evitadb-server.md)).

## Slot names

`test/components/slotNames.test.ts` is the one exception to the pure-logic focus: it parses every
`src/**/*.vue` file with `vue/compiler-sfc` and asserts that no component is passed a
`<template #slot-name>` it doesn't declare. Vue ignores unknown slots silently, so such a typo
otherwise only shows up as a missing label in the UI.

The declared slot names are read from each component's own `<slot>` outlets, and a used component is
resolved through its `import` path — file names alone are ambiguous (both recording modules ship a
`StartRecordingDialog.vue`). Usages are skipped, not failed, when the name cannot be resolved
statically: globally registered or dynamically named components, dynamic slot names
(`<template #[name]>`), and components with a dynamically named `<slot :name="…">` outlet.

When a failure names a slot you *intended* to add, add the `<slot>` outlet to the target component —
don't relax the test.

## CI

`yarn test` runs in GitHub Actions on every push to `dev` (`.github/workflows/dev.yml`) and as part
of the release build from `master` (`.github/workflows/release.yml`) — see
[build & tooling](build-and-tooling.md).
