---
name: evitadb-server
description: Decide and manage the evitaDB backend used by evitaLab during agent development. Ask once per session whether to use the DEMO server or a local Dockerized evitaDB, then start/stop the container as needed. Use before running `yarn dev` for any task that verifies UI behavior.
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
- Never mutate the user's `.env.local`. Always run vite with **inline env vars**.
  Use the same hostname the script probed (see `evitadb-server.sh status` output
  or `echo "${DOCKER_HOST#tcp://}" | cut -d: -f1`):
  `env VITE_DEV_CONNECTION=LOCAL VITE_DEV_LOCAL_URL=http://<docker-host>:5555 yarn dev`.
- On task completion (or when explicitly asked to clean up), stop **and remove**
  the container: `scripts/evitadb-server.sh stop`.

## Workflow

### Step 1 — Decide the backend

If the plan does not already record a backend decision for this session, ask
the user exactly:

> Does this task touch an unreleased evitaDB feature/API? If yes I'll spin up
> a local Dockerized evitaDB (`latest` tag). If no I'll use the demo server.
> [Y = LOCAL / N = DEMO]

Persist the answer to the current plan file under a heading like
`## evitaDB backend for this session`.

Heuristics that push toward LOCAL (still confirm with the user):
- Task references an evitaDB PR / issue / unreleased endpoint.
- User mentions `dev` branch of evitaDB or "latest" evitaDB.
- Task adds gRPC / GraphQL / REST calls to endpoints not present in
  `src/modules/database-driver/connector/grpc/gen/` after last regeneration.

### Step 2A — DEMO branch

Do nothing special. Run vite normally:

```bash
yarn dev
```

`.env.local` already defaults to `VITE_DEV_CONNECTION=DEMO`.

### Step 2B — LOCAL branch

Start the container (defaults to `canary` tag = evitaDB `dev` branch). The
script auto-detects the docker-host name from `DOCKER_HOST`:

```bash
./scripts/evitadb-server.sh start
```

If the user has requested a pinned tag, pass `--tag <version>` (e.g.
`--tag 2026.1`). No auto-resolution — only use a tag the user explicitly names.

Then run vite with inline env vars — **do not edit `.env.local`**. Use the same
hostname the script probed:

```bash
DOCKER_HOSTNAME=$(echo "${DOCKER_HOST#tcp://}" | cut -d: -f1)
DOCKER_HOSTNAME=${DOCKER_HOSTNAME:-localhost}
env VITE_DEV_CONNECTION=LOCAL VITE_DEV_LOCAL_URL=http://${DOCKER_HOSTNAME}:5555 yarn dev
```

### Step 3 — Verify

Confirm the container is healthy before touching evitaLab code:

```bash
./scripts/evitadb-server.sh status
```

Expected `readiness: ready`. If not ready, inspect logs:

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

- Script source: `scripts/evitadb-server.sh`
- Container name: `evitalab-dev-evitadb`
- Port: `5555` (all evitaDB APIs multiplexed on one port)
- Data volume: `/evita-data` on the docker host → `/evita/data` in the container
- Readiness endpoint: `http://<host>:5555/system/readiness` (HTTP 200 = ready)
