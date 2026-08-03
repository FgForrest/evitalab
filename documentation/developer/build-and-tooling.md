# Build & tooling

Reference of the build pipeline, environment variables and developer tooling. For basic setup see
[running development version](running-development-version.md) and
[building from source](building-from-source.md).

## Package manager & Node

- **Yarn only.** Never run `npm install`/`npm ci`/`npx` in this repo — npm writes
  `package-lock.json`, diverging from `yarn.lock`.
- Node.js version is pinned in `.nvmrc`.
- `node_modules/.gitignore` and `node_modules/.gitkeep` are **tracked** — the `.gitignore` ignores
  everything in the folder except itself and `.gitkeep`, which is what keeps an installed dependency
  tree out of `git status`. A wiped `node_modules` therefore shows up as two deleted files; restore
  them (`git checkout -- node_modules/.gitignore node_modules/.gitkeep`) rather than committing the
  deletion.

### Empty `node_modules` (agent sandboxes)

A fresh sandbox checkout typically has an **empty `node_modules`**, so every tool-invoking script
fails with `error Command "<tool>" not found` (`vitest`, `vue-tsc`, `eslint`). That is a setup gap,
not a code problem: run `yarn install` and retry. Agents should do this without asking, and note it
in their summary since it changes the working tree. Yarn v1 does not re-resolve versions the lockfile
already pins, so a clean install leaves `yarn.lock` untouched — a diff there is pre-existing work.

## Scripts (`package.json`)

| Script | Purpose |
|--------|---------|
| `yarn dev` | Dev server at `localhost:3000/lab` (standalone mode) |
| `yarn dev-driver` | Dev server at `localhost:3000` in `DRIVER` run mode |
| `yarn dev:with-evitadb` | Starts a local Dockerized evitaDB and dev server with `VITE_DEV_CONNECTION=LOCAL` |
| `yarn typecheck` | Whole-program type check (`vue-tsc -b --force`, covers the app project **and** `vite.config.mts`) |
| `yarn build` / `yarn build-driver` | `yarn typecheck` + production build (standalone/driver) |
| `yarn verify` | One-shot local pre-push gate: `yarn lint && yarn typecheck && vitest run` (tests run once, not in watch mode) |
| `yarn preview` | Serves the production build on port 3000 |
| `yarn lint` | ESLint with auto-fix (flat config) |
| `yarn lint:check` | ESLint **without** auto-fix — fails on any problem; used by CI |
| `yarn test` | Vitest |
| `yarn evitadb:start\|stop\|status\|logs` | Manage the local evitaDB container (`scripts/evitadb-server.sh`, see [evitaDB server](evitadb-server.md)) |

## Standalone scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `scripts/evitadb-server.sh` | Local Dockerized evitaDB lifecycle — see [evitaDB server](evitadb-server.md) |
| `scripts/serve-dist.sh` | Serves a built `dist/` over HTTP with the correct base path and an injected evitaDB connection; needs only `python3` (no Node.js) — see [building from source](building-from-source.md#serving-the-built-dist-locally) |

## Environment variables

Set in `.env` / `.env.local` (never commit `.env.local`; agent flows must not mutate it — use
inline env vars):

| Variable | Meaning |
|----------|---------|
| `VITE_RUN_MODE` | `STANDALONE` (default) or `DRIVER` — see [architecture](architecture.md#run-modes) |
| `VITE_DEV_CONNECTION` | Dev connection target: `DEMO` (default, `https://demo.evitadb.io`) or `LOCAL` |
| `VITE_DEV_LOCAL_URL` | Override for the `LOCAL` connection URL |
| `VITE_BUILD_VERSION` | Build version; in CI populated from `EVITALAB_BUILD_VERSION` |

Not an env variable, but injected the same way: `__EVITADB_API_VERSION__` is a global constant added to the
Vite `define` block, read from `.evitadbrc` at config time. It is the oldest evitaDB API version evitaLab
supports and it is declared to the server as the `clientVersion` gRPC header — see
[evitaDB server — versioning](evitadb-server.md#versioning).

## Type checking

`yarn typecheck` runs `vue-tsc -b --force` against the solution-style root
`tsconfig.json`, which references `tsconfig.app.json` (the `src/**` app),
`tsconfig.node.json` (`vite.config.mts`) and `tsconfig.vitest.json` (the
`test/**` suite — see [testing](testing.md)). `-b` (build mode) is required for a
solution config — a plain `vue-tsc --noEmit` against the root would load
`"files": []` and check **nothing**. `--force` avoids stale-`.tsbuildinfo` false
greens. All projects set `noEmit`-compatible options, so only `.tsbuildinfo`
files are written (under `node_modules/.tmp/`).

`tsconfig.app.json` enables the strict flags `noFallthroughCasesInSwitch`,
`noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters` and
`noUncheckedIndexedAccess` (on top of `strict`). `exactOptionalPropertyTypes` is
**deliberately not enabled** — it is not part of `strict` and structurally
conflicts with Vuetify prop typing (`prop?: T`); the rationale is documented
inline in `tsconfig.app.json`.

`yarn build` / `yarn build-driver` run `yarn typecheck` first, so a type error
fails the build. Both `src/**` and `test/**` are type-checked; keep the whole
tree at **zero** errors — any new error is a real regression.

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
  - `vite-plugin-vue-layouts-next`.
- **SCSS**: Sass's `NodePackageImporter` is registered
  (`css.preprocessorOptions.scss.importers`) so stylesheets can `@use 'pkg:<package>'` —
  required by `src/styles/fonts.scss`.

Generated `*.d.ts` files are committed but never edited manually.

## Fonts

evitaLab contacts **no remote font provider** — a request to `fonts.googleapis.com` /
`fonts.gstatic.com` would leak the visitor's IP address to a third party
([issue #183](https://github.com/FgForrest/evitalab/issues/183), GDPR). Both fonts are bundled from
npm packages and emitted into `dist/assets/`:

- **Poppins** (UI font) — declared in `src/styles/fonts.scss`, which drives the
  `@fontsource-utils/scss` `faces` mixin off `@fontsource/poppins` metadata. Imported from
  `src/vue-plugins/vuetify.ts`.
  - subsets `latin` + `latin-ext` (`latin-ext` is mandatory — catalog data routinely contains Czech
    and Polish diacritics),
  - weights 300/400/500/700/900 normal, plus 300/400 italic,
  - `woff2` only (every browser in `.browserslistrc` supports it).
  - A weight or style that is not listed there **silently falls back** to the system sans-serif with
    no console error, so extend the mixin arguments when the UI starts using a new one.
- **Material Design Icons** — `@mdi/font`, imported as its own stylesheet in
  `src/vue-plugins/vuetify.ts`.

`src/styles/settings.scss` sets Vuetify's `$body-font-family` to Poppins, so Vuetify's own generated
typography does not reference the unbundled Roboto.

There is a regression guard in `test/fonts/localFonts.test.ts` — it fails if any remote font host or
`webfontloader` reappears anywhere under `src/`, in `index.html`, `vite.config.mts` or
`package.json`.

## Third-party licenses

Bundling fonts and code makes evitaLab a redistributor, so the attribution files must ship **inside
the built artifact**, not just in the repository. They live in `public/`, which Vite copies verbatim
to the dist root in both run modes:

- `public/THIRD-PARTY-NOTICES.txt` — the index of every bundled third-party artifact with its
  copyright holder and license. **Generated, not hand-maintained**: run
  `node scripts/generate-third-party-notices.mjs` and **commit the output** (it needs `node_modules`,
  and it is deliberately not part of `yarn build` so that a stale file surfaces as a failing test
  rather than being silently regenerated). `--check` verifies the committed file is up to date. The
  generator carries a small override table for packages whose license cannot be detected
  automatically (e.g. `keymaster` declares none; `dompurify` is dual-licensed and evitaLab elects
  Apache-2.0). The same content is mirrored at the repository root for the source distribution.
- `public/licenses/Apache-2.0.txt` — the Apache License 2.0 text, required by §4(a) to accompany the
  bundled Apache-2.0 dependencies and the MDI webfont.
- `public/licenses/OFL-1.1-Poppins.txt` — verbatim copy of
  `node_modules/@fontsource/poppins/LICENSE` (SIL Open Font License 1.1 §2).
- `public/licenses/Apache-2.0-MaterialDesignIcons.txt` — verbatim copy of
  `node_modules/@mdi/font/LICENSE`.

The two font license files are **static committed copies**, so they are diff-reviewable and work
offline. **Re-copy them when bumping `@fontsource/poppins` or `@mdi/font`.**
`test/fonts/localFonts.test.ts` asserts all four files exist and are non-empty.

## Linting

ESLint 9 **flat config** (`eslint.config.mjs`) built with
`defineConfigWithVueTs` (`@vue/eslint-config-typescript` 14) + the
`eslint-plugin-vue` `flat/essential` preset + `vueTsConfigs.recommended`. It
bridges the generated `.eslintrc-auto-import.json` globals via
`languageOptions.globals` and ignores `dist`, generated `*.d.ts`
(`auto-imports`/`components`/`typed-router`) and the grpc `gen/` dir. Run
`yarn lint` before committing.

The lint ruleset is **green (zero problems)** and enforced in CI via
`yarn lint:check` (non-fixing). Keep it there: prefer precise types or
`unknown` + narrowing over `any`. There is a single justified
`no-explicit-any` disable-block in
`EntityGridColumnHeader.vue` for the Vuetify `#headers` slot bindings, whose
types (`InternalDataTableHeader`, `IconValue`) are not exported through any
resolvable Vuetify entry point.

## gRPC client generation

The gRPC/protobuf client model under `src/modules/database-driver/connector/grpc/gen/` is generated
from the evitaDB repository using [buf](https://buf.build/) (`buf.gen.yaml`). Regenerate when the
evitaDB proto files change (agents: use the `generate-evitadb-client` skill). Never edit generated
files.

## CI/CD (GitHub Actions)

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `.github/workflows/dev.yml` | push to `dev` **and** pull requests targeting `dev` | Verify: install (`yarn install --frozen-lockfile`), `yarn lint:check`, `yarn typecheck`, `yarn test`, `yarn build` |
| `.github/workflows/release.yml` | push to `master` | Resolves a calendar-semantic version from conventional commits (`semantic-calendar-version`), tests, builds **standalone** and **driver** dists, creates a GitHub release (release-drafter) with `dist-standalone` and `dist-driver` zip/tar.gz assets |

Versioning depends on [conventional commits](https://www.conventionalcommits.org/) — this is why
commit message format is mandatory. The release also resolves the **minimum compatible evitaDB
version** used by integrations.
