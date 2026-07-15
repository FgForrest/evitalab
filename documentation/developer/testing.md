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

## What to test

Current coverage focuses on pure logic: utilities, parsers, model helpers. When you add or fix
logic that does not require a running server or DOM (formatters, converters, query builders,
utility functions), add a unit test with it — **every bug fix in such logic should include a
regression test**.

UI components and server-dependent flows are currently verified manually against a running evitaDB
instance (see [running development version](running-development-version.md) and
[evitaDB server](evitadb-server.md)).

## CI

`yarn test` runs in GitHub Actions on every push to `dev` (`.github/workflows/dev.yml`) and as part
of the release build from `master` (`.github/workflows/release.yml`) — see
[build & tooling](build-and-tooling.md).
