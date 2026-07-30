---
name: build-evitalab
description: Build evitaLab into a production dist (standalone or driver run mode) and hand the developer a copy-paste command to serve it locally without a Node.js environment. Use when the user asks to "build it so I can test it now", wants to verify agent changes in a real browser, or asks for a production/driver build.
user_invocable: true
---

# build-evitalab

Produces a production build of evitaLab that the **developer** can open in their
own browser to verify the agent's changes — without installing Node.js or
running vite in dev mode. The agent builds; the developer serves the result with
`scripts/serve-dist.sh` (needs only `python3`).

Use this instead of `yarn dev` when the user says something like *"I want to test
it now, build it"*, or when the change must be checked in the driver run mode
(`yarn dev-driver` covers driver mode too, but only inside the agent's sandbox).

## Strict rules

- **Package manager is yarn.** Never run `npm install`, `npm ci` or `npx`. If
  yarn appears broken, fix it (corepack, proxy allowlist, missing binary) — do
  not fall back to npm, which would write a `package-lock.json` diverging from
  `yarn.lock`.
- **Both run modes write into the same `dist/` directory.** A standalone build
  overwrites a driver build and vice versa. Build one mode at a time and tell
  the user which mode `dist/` currently holds.
- **`yarn build` runs `yarn typecheck` first.** If it fails, the failure is a
  real regression in the working tree — report the type errors to the user and
  fix them. Never work around the gate (no `vite build` without typecheck, no
  `--force`, no touching `tsconfig`).
- **Never mutate `.env.local`.** Pass build-time variables inline.
- Do **not** commit `dist/` (it is git-ignored) and do not commit anything
  unless explicitly asked.

## Workflow

### Step 1 — Pick the run mode

Standalone unless the user says otherwise. Ask only if it is genuinely unclear:

| Mode | Command | Served under | For |
|------|---------|--------------|-----|
| `STANDALONE` (default) | `yarn build` | `/lab/` | the regular web app |
| `DRIVER` | `yarn build-driver` | `/` | the [evitaLab Desktop](https://github.com/FgForrest/evitalab-desktop) shell |

A driver dist opens fine in a plain browser tab — the desktop bridge is
optional (`ToasterFactory` falls back to the local toaster when
`window.labNotificationManager` is absent). Only the desktop shell chrome
(window management, cross-instance notifications) is missing, so driver-specific
IPC behaviour still has to be verified inside evitaLab Desktop itself.

### Step 2 — Build

```bash
yarn install --frozen-lockfile   # only if node_modules is missing/stale
yarn build                       # or: yarn build-driver
```

`VITE_BUILD_VERSION` is optional — it only feeds the version shown on the
welcome screen and the asset-name cache-busting suffix. Set it inline if the
user wants a recognisable label:

```bash
env VITE_BUILD_VERSION=my-branch yarn build
```

Report build warnings (e.g. chunk size) only if they are new.

### Step 3 — Decide which evitaDB server the developer will use

A production build has **no** dev connection baked in — `VITE_DEV_CONNECTION`
applies to `yarn dev` only. The connection is injected into the URL by
`serve-dist.sh` via its `--server-url` flag, so the only thing to decide is
which server URL to hand over:

- `https://demo.evitadb.io` — the public demo server.
- `http://localhost:5555` — the developer's own evitaDB (the default).

If this session already recorded a backend decision (see the
[`evitadb-server`](../evitadb-server/SKILL.md) skill, which owns the
DEMO-vs-LOCAL choice and the container lifecycle), reuse it instead of asking
again. Note that a container started by that skill runs in the **agent's**
sandbox — it is usually not reachable from the developer's machine, so for the
developer's own verification prefer the demo server or their local evitaDB.

### Step 4 — Hand over the run instructions

Print the exact commands for the developer, including the server URL:

```bash
./scripts/serve-dist.sh --server-url https://demo.evitadb.io
```

The script prints the URL to open, which already carries the connection as the
`evitalab-connection` URL system property:

```
[serve-dist] open: http://localhost:8080/lab/?evitalab-connection=<base64>
```

Also tell the user:

- the run mode currently in `dist/`,
- what to look for (the concrete change to verify),
- that the server runs in the foreground — Ctrl-C stops it,
- that after any new build a plain browser reload is enough (the script sends
  `Cache-Control: no-store`).

If the port is taken, `--port <port>` overrides it. Full flag list:
`./scripts/serve-dist.sh --help`.

### Step 5 — CORS caveat

The browser talks to evitaDB directly from the served origin
(`http://localhost:8080`), cross-origin. A local evitaDB must therefore run its
APIs over plain HTTP (`tlsMode=RELAXED`), the same way
`scripts/evitadb-server.sh` configures it, and accept that origin. If the
developer reports `Failed to fetch` / CORS errors, this is the first thing to
check — not an evitaLab bug.

A malformed `--server-url` (missing scheme) is rejected by the script, because
the lab itself would only show an endless "Loading …" splash.

## Reference

- Script source: `scripts/serve-dist.sh` (only prerequisite: `python3`)
- Build scripts and env variables:
  [build & tooling](../../../documentation/developer/build-and-tooling.md)
- Serving a build:
  [building from source](../../../documentation/developer/building-from-source.md)
- Run modes:
  [architecture — run modes](../../../documentation/developer/architecture.md#run-modes)
- Backend decision & container lifecycle: `evitadb-server` skill
