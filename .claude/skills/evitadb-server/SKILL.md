---
name: evitadb-server
description: Decide and manage the evitaDB backend used by evitaLab during agent development. Ask once per session whether to use the DEMO server, a local Dockerized evitaDB, or a local build of the evitaDB source tree, then start/stop the container as needed. Use before running `yarn dev` for any task that verifies UI behavior.
user_invocable: true
---

# evitadb-server

evitaLab needs an evitaDB backend when verifying changes. The agent picks
between three backends **once per session**:

- **DEMO** — `https://demo.evitadb.io`. Cheap, quick. Use for evitaLab-only
  work (UI polish, refactors, bugfixes that don't depend on new evitaDB APIs).
- **LOCAL-canary** — a Docker container running `evitadb/evitadb:canary` (the
  `dev`-branch build, default) or a pinned tag. Use when the task involves an
  **unreleased but committed** evitaDB feature or API change.
- **LOCAL-source** — evitaDB built from the local working tree and run in the
  same container shape. The only option when the task itself authors the
  evitaDB change, because `canary` only ever contains *committed* `dev`.

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
- **Never delegate the evitaDB build to the user or an IDE.** The IntelliJ MCP is
  not available, so `start --source` *is* the build — and never assume
  `evita_server/target/evita-server.jar` is current.
- **Never commit in the evitaDB repository** on the user's behalf, never run
  `mvn clean`, and never otherwise revert the user's evitaDB working tree.
  `target/` is the only directory the tooling writes.
- **Never write into `/evita-data` from source mode** unless the user explicitly
  asks for `--data-dir /evita-data` — a source build may carry unreleased
  storage-format changes.
- **Package manager is yarn. Never run `npm install`, `npm ci`, or `npx` in this
  repo.** Only `yarn install [--frozen-lockfile]`, `yarn add`, `yarn dev`, etc.
  If yarn appears broken, diagnose (proxy allowlist, corepack, missing binary)
  and fix it — do not fall back to npm, as npm may write `package-lock.json`
  which diverges from `yarn.lock`.

## Workflow

### Step 1 — Decide the backend

If the plan does not already record a backend decision for this session, ask
the user exactly:

> Which evitaDB backend? **(D)** demo server · **(C)** local Docker `canary`
> (committed `dev`) · **(S)** local build from the evitaDB working tree (needed
> when this session also changes evitaDB; the first Maven build may take several
> minutes, later ones under a minute).

Persist the answer to the current plan file under a heading like
`## evitaDB backend for this session`.

Heuristics that push toward **LOCAL-canary** (still confirm with the user):
- Task references an evitaDB PR / issue / unreleased endpoint.
- User mentions `dev` branch of evitaDB or "latest" evitaDB.
- Task adds gRPC / GraphQL / REST calls to endpoints not present in
  `src/modules/database-driver/connector/grpc/gen/` after last regeneration.

Heuristics that push toward **LOCAL-source** (still confirm; never auto-escalate):
- The session also edits the evitaDB repo (proto / service / converter changes).
- The task needs an RPC or endpoint that does not exist in `canary` yet.
- The user says "against my local evitaDB / my branch / my uncommitted changes".

### Step 2A — DEMO branch

Do nothing special. Run vite normally:

```bash
yarn dev
```

`.env.local` already defaults to `VITE_DEV_CONNECTION=DEMO`.

### Step 2B — LOCAL-canary branch

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

### Step 2C — LOCAL-source branch

**The order matters** — it is the whole reason this mode exists:

1. If the session changes evitaDB `.proto` files, run the
   `generate-evitadb-client` skill **against the working tree that will be
   built**. The generator only reads `.proto` files and needs no jar; the
   constraint is a *revision* one — generated stubs and the running server must
   come from one source revision, or evitaLab calls an RPC shape the server does
   not implement.
2. Start the server — this **builds the jar with Maven itself**:

   ```bash
   ./scripts/evitadb-server.sh start --source
   ```

   Add `--repo <path>` if the evitaDB checkout is neither `$EVITADB_REPO` nor the
   sibling `../evitaDB`. The Maven build takes under a minute with a warm `~/.m2`
   and several minutes on the first ever build — that is expected, not a hang.

3. Run vite exactly as in Step 2B (same inline env vars, same host derivation).

After **any** later edit to evitaDB sources, re-run
`./scripts/evitadb-server.sh start --source`; re-run `generate-evitadb-client`
first if the proto changed. Because Maven's shaded jar is not reproducible, every
`start --source` rebuilds and **recreates** the container (a new container id and
~4s of readiness wait) — that is the mechanism that prevents an old jar from
being served, not a bug. `--no-build` skips the build and reuses the running
container; use it only when iterating on evitaLab against an unchanged server.

### Step 3 — Verify

Confirm the container is healthy before touching evitaLab code:

```bash
./scripts/evitadb-server.sh status
```

Expected `readiness: ready`. In source mode it must also show `mode: source` and
**neither** `jar: STALE` nor `sources: NEWER THAN JAR` — check this *before*
debugging any "the RPC is missing" symptom; both lines mean the running server
predates the current sources. If not ready, inspect logs:

```bash
./scripts/evitadb-server.sh logs
```

### Step 4 — Cleanup

When the task is done (LOCAL branches only), stop and remove the container:

```bash
./scripts/evitadb-server.sh stop
```

Leave the evitaDB working tree as it is — no `mvn clean`, no revert, `target/`
untouched. If the user explicitly asks to leave the container running for
follow-up work, skip this step.

## Reference

- Script source: `scripts/evitadb-server.sh`
- Container name: `evitalab-dev-evitadb`
- Port: `5555` (all evitaDB APIs multiplexed on one port)
- Data volume (image mode): `/evita-data` on the docker host → `/evita/data`
- Data volume (source mode): `$EVITADB_SOURCE_DATA_DIR` or
  `~/.evitalab/evita-data-source` (created on demand), overridable with
  `--data-dir <path>`
- Source-mode container labels: `io.evitalab.mode=source|image`,
  `io.evitalab.jar-path`, `io.evitalab.jar-mtime` (drives stale-jar detection),
  `io.evitalab.debug-port` (a changed `--debug` request also forces a recreate)
- Source mode enables `api.endpoints.gRPC.exposeDocsService=true` (gRPC
  reflection, so `grpcurl` can verify a new RPC without a regenerated client)
- `--debug [port]` publishes a JDWP agent, default port `8005`
- Readiness endpoint: `http://<host>:5555/system/readiness` (HTTP 200 = ready)
- Full documentation: `documentation/developer/evitadb-server.md`
