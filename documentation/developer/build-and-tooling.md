# Build & tooling

Reference of the build pipeline, environment variables and developer tooling. For basic setup see
[running development version](running-development-version.md) and
[building from source](building-from-source.md).

## Package manager & Node

- **Yarn only.** Never run `npm install`/`npm ci`/`npx` in this repo — npm writes
  `package-lock.json`, diverging from `yarn.lock`.
- Node.js version is pinned in `.nvmrc`.

## Scripts (`package.json`)

| Script | Purpose |
|--------|---------|
| `yarn dev` | Dev server at `localhost:3000/lab` (standalone mode) |
| `yarn dev-driver` | Dev server at `localhost:3000` in `DRIVER` run mode |
| `yarn dev:with-evitadb` | Starts a local Dockerized evitaDB and dev server with `VITE_DEV_CONNECTION=LOCAL` |
| `yarn typecheck` | Whole-program type check (`vue-tsc -b --force`, covers the app project **and** `vite.config.mts`) |
| `yarn build` / `yarn build-driver` | `yarn typecheck` + production build (standalone/driver) |
| `yarn verify` | One-shot local pre-push gate: `yarn lint && yarn typecheck && yarn test` |
| `yarn preview` | Serves the production build on port 3000 |
| `yarn lint` | ESLint with auto-fix (flat config) |
| `yarn test` | Vitest |
| `yarn evitadb:start\|stop\|status\|logs` | Manage the local evitaDB container (`scripts/evitadb-server.sh`, see [evitaDB server](evitadb-server.md)) |

## Environment variables

Set in `.env` / `.env.local` (never commit `.env.local`; agent flows must not mutate it — use
inline env vars):

| Variable | Meaning |
|----------|---------|
| `VITE_RUN_MODE` | `STANDALONE` (default) or `DRIVER` — see [architecture](architecture.md#run-modes) |
| `VITE_DEV_CONNECTION` | Dev connection target: `DEMO` (default, `https://demo.evitadb.io`) or `LOCAL` |
| `VITE_DEV_LOCAL_URL` | Override for the `LOCAL` connection URL |
| `VITE_BUILD_VERSION` | Build version; in CI populated from `EVITALAB_BUILD_VERSION` |

## Type checking

`yarn typecheck` runs `vue-tsc -b --force` against the solution-style root
`tsconfig.json`, which references `tsconfig.app.json` (the `src/**` app) and
`tsconfig.node.json` (`vite.config.mts`). `-b` (build mode) is required for a
solution config — a plain `vue-tsc --noEmit` against the root would load
`"files": []` and check **nothing**. `--force` avoids stale-`.tsbuildinfo` false
greens. Both projects set `noEmit`-compatible options, so only `.tsbuildinfo`
files are written (under `node_modules/.tmp/`).

`yarn build` / `yarn build-driver` run `yarn typecheck` first, so a type error
fails the build. Tests under `test/**` are **not** yet covered by any tsconfig
(they are transpiled, not type-checked — a future hardening step).

## Vite configuration (`vite.config.mts`)

- **Path alias**: `@` → `src/`.
- **Dev server**: port 3000; `base` URL is `/lab/` in standalone, `/` in driver mode.
- **Build output**: standalone chunks get a version suffix in file names (cache busting keyed by
  an xxhash of the version); driver builds inline dynamic imports into a single bundle.
- **Plugins**:
  - `unplugin-vue-router` — typed router (generates `src/typed-router.d.ts`),
  - `unplugin-auto-import` — auto-imports Vue/router/Pinia APIs (generates
    `src/auto-imports.d.ts` + ESLint config `.eslintrc-auto-import.json`),
  - `unplugin-vue-components` — auto-registration of components (generates `src/components.d.ts`),
  - `vite-plugin-vuetify` — Vuetify with SASS settings from `src/styles/settings.scss`,
  - `unplugin-fonts` — Roboto via Fontsource,
  - `vite-plugin-vue-layouts-next`.

Generated `*.d.ts` files are committed but never edited manually.

## Linting

ESLint 9 **flat config** (`eslint.config.mjs`) built with
`defineConfigWithVueTs` (`@vue/eslint-config-typescript` 14) + the
`eslint-plugin-vue` `flat/essential` preset + `vueTsConfigs.recommended`. It
bridges the generated `.eslintrc-auto-import.json` globals via
`languageOptions.globals` and ignores `dist`, generated `*.d.ts`
(`auto-imports`/`components`/`typed-router`) and the grpc `gen/` dir. Run
`yarn lint` before committing.

> The lint ruleset is not yet at zero — the codebase predates any working lint
> gate (ESLint 9 silently ignored the old `.eslintrc.js`). High-volume rules
> (`no-explicit-any`, `no-unused-vars`) are pending a burn-down before `yarn lint`
> joins the CI gate.

## gRPC client generation

The gRPC/protobuf client model under `src/modules/database-driver/connector/grpc/gen/` is generated
from the evitaDB repository using [buf](https://buf.build/) (`buf.gen.yaml`). Regenerate when the
evitaDB proto files change (agents: use the `generate-evitadb-client` skill). Never edit generated
files.

## CI/CD (GitHub Actions)

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `.github/workflows/dev.yml` | push to `dev` **and** pull requests targeting `dev` | Verify: install (`yarn install --frozen-lockfile`), `yarn typecheck`, `yarn test`, `yarn build` |
| `.github/workflows/release.yml` | push to `master` | Resolves a calendar-semantic version from conventional commits (`semantic-calendar-version`), tests, builds **standalone** and **driver** dists, creates a GitHub release (release-drafter) with `dist-standalone` and `dist-driver` zip/tar.gz assets |

Versioning depends on [conventional commits](https://www.conventionalcommits.org/) — this is why
commit message format is mandatory. The release also resolves the **minimum compatible evitaDB
version** used by integrations.
