---
name: evitadb-server
description: Decide and manage the evitaDB backend used by evitaLab during agent development. Ask once per session whether to use the DEMO server or a local Dockerized evitaDB, then start/stop the container as needed. Use before starting the dev server for any task that verifies UI behavior.
user_invocable: true
---

# evitadb-server

evitaLab needs an evitaDB backend when verifying changes. The agent picks
between two backends **once per session**:

- **DEMO** — `https://demo.evitadb.io`. Cheap, quick. Use for evitaLab-only
  work (UI polish, refactors, bugfixes that don't depend on new evitaDB APIs).
- **LOCAL** — a Docker container running `evitadb/evitadb:canary` (the
  `dev`-branch build, default) or a pinned tag. Use when the task involves an
  **unreleased** evitaDB feature or API change.

## Strict rules

- Ask the decision question **once per session/issue** and record the answer in
  the active plan (`.claude/plans/<current-plan>.md`). Do not re-ask.
- The script auto-detects the docker-host hostname from `DOCKER_HOST`
  (e.g. `tcp://docker:2375` → probe `docker:5555`). Only pass `--host <host>`
  when the auto-detected value is wrong for the current sandbox.
- Never mutate the user's `.env.local`. Select the connection with `yarn dev:local`
  / `yarn dev:demo` (shell `VITE_*` vars override the `.env` files) and pass any
  extra variable inline. Use the same hostname the script probed (see
  `evitadb-server.sh status` output or `echo "${DOCKER_HOST#tcp://}" | cut -d: -f1`):
  `env VITE_DEV_LOCAL_URL=http://<docker-host>:5555 yarn dev:local`.
- Never run plain `yarn dev` to verify UI behavior — its target depends on the
  developer's `.env.local` and is not necessarily the backend you just chose.
- `start` / `restart` **require** `--data-dir`; it has no default. Always pass
  **`--data-dir /evita-data`** — that is the shared dev data set with the
  catalogs the user expects. Only use a different directory (a docker volume
  name = throwaway empty catalogs) when the user explicitly asks for it, and say
  so in the summary.
- Custom evitaDB properties (see *Custom properties* below) and the data
  directory are baked in at container creation. Changing either requires
  `restart`, never `start` — `start` on an already-running container with a
  different data directory or property set fails loudly instead of silently
  keeping the old configuration.
- On task completion (or when explicitly asked to clean up), stop **and remove**
  the container: `scripts/evitadb-server.sh stop`.
- **Package manager is yarn. Never run `npm install`, `npm ci`, or `npx` in this
  repo.** Only `yarn install [--frozen-lockfile]`, `yarn add`, `yarn dev`, etc.
  If yarn appears broken, diagnose (proxy allowlist, corepack, missing binary)
  and fix it — do not fall back to npm, as npm may write `package-lock.json`
  which diverges from `yarn.lock`.

## Workflow

### Step 1 — Decide the backend

If the plan does not already record a backend decision for this session, ask
the user exactly:

> Does this task touch an unreleased evitaDB feature/API? If yes I'll spin up
> a local Dockerized evitaDB (`canary` tag = `dev` branch). If no I'll use the
> demo server. [Y = LOCAL / N = DEMO]

Persist the answer to the current plan file under a heading like
`## evitaDB backend for this session`.

Heuristics that push toward LOCAL (still confirm with the user):
- Task references an evitaDB PR / issue / unreleased endpoint.
- User mentions `dev` branch of evitaDB or "latest" evitaDB.
- Task adds gRPC / GraphQL / REST calls to endpoints not present in
  `src/modules/database-driver/connector/grpc/gen/` after last regeneration.

### Step 2A — DEMO branch

Run vite with the connection forced to the demo server:

```bash
yarn dev:demo
```

Use `dev:demo`, not plain `yarn dev` — the developer's `.env.local` may be left on
`VITE_DEV_CONNECTION=LOCAL`, in which case `yarn dev` would silently target a local
server that is not running. A `VITE_*` shell variable overrides the `.env` files,
so `dev:demo` wins without mutating `.env.local`.

### Step 2B — LOCAL branch

Start the container (defaults to `canary` tag = evitaDB `dev` branch). The
script auto-detects the docker-host name from `DOCKER_HOST`. `--data-dir` is
required and for agent work it is always `/evita-data`:

```bash
./scripts/evitadb-server.sh start --data-dir /evita-data
```

If the user has requested a pinned tag, pass `--tag <version>` (e.g.
`--tag 2026.1`). No auto-resolution — only use a tag the user explicitly names.

If the task needs a non-default server configuration, pass the properties too —
see *Custom properties* below. If `start` fails with
`No data directory specified`, you omitted the argument — add
`--data-dir /evita-data`; do not invent another directory.

There are **no yarn wrappers** for the container (no `yarn evitadb:*`, no
`yarn dev:with-evitadb`) — always call `scripts/evitadb-server.sh` directly and
start vite as a separate step.

Then run vite via `dev:local` — **do not edit `.env.local`**. Use the same
hostname the script probed:

```bash
DOCKER_HOSTNAME=$(echo "${DOCKER_HOST#tcp://}" | cut -d: -f1)
DOCKER_HOSTNAME=${DOCKER_HOSTNAME:-localhost}
env VITE_DEV_LOCAL_URL=http://${DOCKER_HOSTNAME}:5555 yarn dev:local
```

#### Custom properties

Tasks that depend on non-default server behavior (traffic recording, sampling,
storage limits, disabled endpoints, …) pass evitaDB properties to the container.
Use repeatable `--arg key=value`:

```bash
./scripts/evitadb-server.sh start --data-dir /evita-data \
    --arg server.trafficRecording.enabled=true \
    --arg server.trafficRecording.trafficSamplingPercentage=50
```

The `EVITA_EXTRA_ARGS` env var carries the same list space-separated (and
`EVITA_DATA_DIR` the data directory), which is handy when the same server
configuration is reused across several invocations in one shell:

```bash
export EVITA_DATA_DIR=/evita-data
export EVITA_EXTRA_ARGS="server.trafficRecording.enabled=true"
./scripts/evitadb-server.sh start
```

Rules to follow:

- The script's baseline (self-signed certificates + `RELAXED` TLS) is always
  applied — never re-specify it, and never override the TLS/certificate keys
  unless the user explicitly asks, or evitaLab loses its plain-HTTP connection.
- Precedence is per key: `--arg` > `EVITA_EXTRA_ARGS` > baseline. Overriding a
  baseline key replaces it.
- Values must not contain whitespace (`EVITA_ARGS` is space-separated).
- Only use keys that exist as `${...}` placeholders in evitaDB's
  `evita_server/src/main/resources/evita-configuration.yaml` — verify the key in
  the evitaDB source (`/Users/lho/www/oss/evita/evitaDB`) instead of guessing;
  a typo is accepted silently and simply has no effect.
- Ask the user which properties they need when the task implies non-default
  behavior but does not name the settings. Record the chosen property set in the
  plan file next to the backend decision, so later `restart`s reuse it.
- To change properties later, use `restart` with the full option set —
  `--data-dir` included, since it is required there too. Properties are not
  additive across invocations; every start composes them from scratch.
- Never pass `storage.storageDirectory` as a property — the image's entrypoint
  already sets it. The data directory is chosen with `--data-dir`.

### Step 3 — Verify

Confirm the container is healthy before touching evitaLab code:

```bash
./scripts/evitadb-server.sh status
```

Expected `readiness: ready`, a `data-dir: /evita-data` line, and — when custom
properties were requested — a `properties:` line containing them. If not ready,
inspect logs:

```bash
./scripts/evitadb-server.sh logs
```

### Step 4 — Cleanup

When the task is done (LOCAL branch only), stop and remove the container:

```bash
./scripts/evitadb-server.sh stop
```

If the user explicitly asks to leave the container running for follow-up work,
skip this step.

## Reference

- Script source: `scripts/evitadb-server.sh` (`--help` lists all options)
- Full docs incl. data directory & property merging:
  `documentation/developer/evitadb-server.md`
- Container name: `evitalab-dev-evitadb`
- Port: `5555` (all evitaDB APIs multiplexed on one port)
- Data volume: required `--data-dir` → `/evita/data` in the container; for agent
  work always `--data-dir /evita-data` (the docker host's shared dev data)
- Readiness endpoint: `http://<host>:5555/system/readiness` (HTTP 200 = ready)
