# evitaDB server

The main server this application access for data retrieval and modification.

This server is responsible for handling all the data-related operations, including querying, indexing, and updating the product catalog. It provides a robust and scalable infrastructure to support the high-performance requirements of the application.

## Versioning

Each evitaLab version must have set the correct oldest evitaDB version that it supports in `.evitadbrc`.
This ensures compatibility and avoids potential issues with incompatible versions. This evitaDB version
basically indicates a version of the evitaDB API (new endpoints, breaking changes, etc.).

`.evitadbrc` is not only build metadata: it is baked into the bundle as `__EVITADB_API_VERSION__` and sent
to the server on every gRPC call as the `clientVersion` header, where it selects the response forms the
server may use (see [database driver — associated data & complex data objects](database-driver.md#associated-data--complex-data-objects)).
Bumping it therefore changes wire behavior, and its value must stay a parseable `major.minor[.patch]` —
evitaDB parses the header without error handling.

## Running a local evitaDB via Docker

For development against unreleased evitaDB features (or when the demo server is not usable),
run a Dockerized evitaDB with the helper script `scripts/evitadb-server.sh`. It is the only
entry point — there are deliberately no yarn wrappers, since `start` always needs arguments and
a wrapper only adds a layer that arguments have to be threaded through.

```bash
./scripts/evitadb-server.sh start --data-dir /evita-data   # pulls image, starts container, waits until ready
./scripts/evitadb-server.sh status                         # container state, data dir, properties, readiness
./scripts/evitadb-server.sh logs -f                        # tail container logs
./scripts/evitadb-server.sh stop                           # stop and remove the container
./scripts/evitadb-server.sh --help                         # all commands and options
```

Then point the dev server at it:

```bash
yarn dev:local
```

Further options — defaults are `--tag canary --wait 120`, and `--host` is derived from
`DOCKER_HOST` (`tcp://<host>:...`) or `localhost` for a native host / Unix socket:

```bash
./scripts/evitadb-server.sh start --data-dir /evita-data --tag 2026.1
./scripts/evitadb-server.sh start --data-dir /evita-data --host my-docker-host   # override when auto-detect is wrong
```

Container details:

- Name: `evitalab-dev-evitadb`
- Image: `index.docker.io/evitadb/evitadb:<tag>` (default tag `canary` = evitaDB `dev` integration branch)
- Port: `5555` (all evitaDB APIs are multiplexed on this port)
- Data volume: the **required** `--data-dir` is mounted to `/evita/data` in the container
- Readiness endpoint: `http://<host>:5555/system/readiness` (HTTP 200 when fully initialized)

The container starts with self-signed certificates and `RELAXED` TLS mode on all endpoints so
evitaLab can connect over HTTP without certificate setup.

Traffic recording is on in the baseline (`server.trafficRecording.enabled=true`) and its flush
interval is lowered to one second (`server.trafficRecording.trafficFlushIntervalInMilliseconds=1000`,
the server default is one minute). Records reach the traffic record history only when the server
flushes its traffic buffer, so the default would make every check of the
[traffic viewer](modules/traffic-viewer.md) wait up to a minute. Override the property if you need
to reproduce the production timing.

### Data directory

`--data-dir` is **required** and deliberately has no default — the data directory decides which
catalogs the server sees, so it is always an explicit choice. `start` without it fails and prints
what to pass.

```bash
# the shared dev data set most tasks want
./scripts/evitadb-server.sh start --data-dir /evita-data

# a docker volume instead of a host path -> throwaway, empty catalog set,
# created on demand and independent of the shared data
./scripts/evitadb-server.sh start --data-dir evitadb-scratch
docker volume rm evitadb-scratch    # discard it afterwards

# export once per shell session instead of repeating it
export EVITA_DATA_DIR=/evita-data
./scripts/evitadb-server.sh start
```

Rules:

- A value containing a slash must be an **absolute host path** and must already exist — otherwise
  docker would create it root-owned. (Existence is checked on the machine running the script,
  which is also the docker host in the usual setup.) Any other value is a **docker volume name**,
  created on demand.
- `--data-dir` wins over the `EVITA_DATA_DIR` env var.
- Like properties, the data directory is fixed at container creation. Pointing the container at a
  different directory requires `restart`; `start` on a running container with a different data
  directory fails and prints both values.
- `status` reports the directory the running container was created with (`data-dir:` line).
- Only one evitaDB may use a data directory at a time — a second server pointed at the same
  directory fails with `FolderAlreadyUsedException: Folder … is already used by another process`.

### Custom evitaDB properties

Server behavior is configured through the `EVITA_ARGS` environment variable — a space-separated
list of `key=value` properties. The script always applies a baseline (self-signed certificates
and `RELAXED` TLS, i.e. what makes the container usable from evitaLab over plain HTTP) and lets
you add or override individual properties in two equivalent ways:

```bash
# repeatable --arg
./scripts/evitadb-server.sh start --data-dir /evita-data \
    --arg server.trafficRecording.enabled=true \
    --arg server.trafficRecording.trafficSamplingPercentage=50

# EVITA_EXTRA_ARGS env var (space-separated), equivalent to the --arg list above
EVITA_EXTRA_ARGS="server.trafficRecording.enabled=true server.trafficRecording.trafficSamplingPercentage=50" \
    ./scripts/evitadb-server.sh start --data-dir /evita-data
```

Merge rules:

- Precedence is `--arg` > `EVITA_EXTRA_ARGS` > built-in defaults, resolved **per key**, so
  overriding a default (e.g. `api.endpoints.gRPC.tlsMode=FORCE_NO_TLS`) replaces it instead of
  emitting the key twice.
- Properties must be `key=value` with no whitespace — the transport is a space-separated string,
  so values containing spaces cannot be passed this way.
- The valid keys are the `${...}` placeholders in evitaDB's
  `evita_server/src/main/resources/evita-configuration.yaml`
  (e.g. `server.trafficRecording.enabled`, `storage.lockTimeoutSeconds`). An unknown key is
  accepted silently and has no effect, so double-check names against that file.
- Do not set `storage.storageDirectory` — the image's entrypoint already passes it; use
  `--data-dir` instead.

Properties are baked into the container at creation time and are **never** applied to a running
one. If a container is already running with a different property set, `start` fails and prints
both sets; use `restart` with the same options to recreate it:

```bash
./scripts/evitadb-server.sh restart --data-dir /evita-data \
    --arg server.trafficRecording.enabled=true
```

`./scripts/evitadb-server.sh status` prints the data directory and property set the running
container was created with, so you can check what is actually in effect.

```
state: running
image: index.docker.io/evitadb/evitadb:canary
data-dir: /evita-data
properties: api.exposedOn=localhost ... server.trafficRecording.enabled=true
readiness: ready (http://localhost:5555/system/readiness = 200)
```

## Overriding the local connection URL

The `LOCAL` dev connection defaults to `http://localhost:5555`. Override it with the
`VITE_DEV_LOCAL_URL` env var when the evitaDB server is reachable at a different host —
for example, when Claude Code (or another agent) runs inside a docker sandbox with
`DOCKER_HOST=tcp://docker:2375`, containers are published on the daemon host and
reachable at `docker:5555`:

```bash
env VITE_DEV_LOCAL_URL=http://docker:5555 yarn dev:local
```

## Switching the dev connection

`yarn dev` uses whatever `VITE_DEV_CONNECTION` is set to in `.env` / `.env.local`. To switch for a
single run without editing those files, use the dedicated scripts — a `VITE_*` variable in the
shell environment takes precedence over the `.env` files:

```bash
yarn dev:demo     # force https://demo.evitadb.io
yarn dev:local    # force the local server (start it with scripts/evitadb-server.sh first)
```

`DRIVER` run mode has the same pair — `yarn dev-driver:demo` / `yarn dev-driver:local`.

## Agentic development

The Claude Code skill `.claude/skills/evitadb-server/SKILL.md` codifies the agent's
decision rule (DEMO vs LOCAL) and container lifecycle. Humans use
`scripts/evitadb-server.sh` plus `yarn dev:local` / `yarn dev:demo` as documented above.