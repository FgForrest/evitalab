# evitaDB server

The main server this application access for data retrieval and modification.

This server is responsible for handling all the data-related operations, including querying, indexing, and updating the product catalog. It provides a robust and scalable infrastructure to support the high-performance requirements of the application.

## Versioning

Each evitaLab version must have set the correct oldest evitaDB version that it supports in `.evitadbrc`.
This ensures compatibility and avoids potential issues with incompatible versions. This evitaDB version
basically indicates a version of the evitaDB API (new endpoints, breaking changes, etc.).

## Running a local evitaDB via Docker

For development against unreleased evitaDB features (or when the demo server is not usable),
you can run a Dockerized evitaDB with the helper script `scripts/evitadb-server.sh` or the
following yarn scripts:

```bash
yarn evitadb:start     # pulls image and starts container, waits until ready
yarn evitadb:status    # container state + readiness probe
yarn evitadb:logs      # tail container logs
yarn evitadb:stop      # stop and remove the container

yarn dev:with-evitadb  # starts container + runs vite against it (VITE_DEV_CONNECTION=LOCAL)
```

Direct script usage:

```bash
# defaults: --tag canary --wait 120
# --host defaults to the hostname derived from DOCKER_HOST (tcp://<host>:...)
# or "localhost" (native host / Unix socket).
./scripts/evitadb-server.sh start
./scripts/evitadb-server.sh start --tag 2026.1
./scripts/evitadb-server.sh start --host my-docker-host   # override when auto-detect is wrong
./scripts/evitadb-server.sh stop
```

Container details:

- Name: `evitalab-dev-evitadb`
- Image: `index.docker.io/evitadb/evitadb:<tag>` (default tag `canary` = evitaDB `dev` integration branch)
- Port: `5555` (all evitaDB APIs are multiplexed on this port)
- Data volume: `/evita-data` on the host is mounted to `/evita/data` in the container
- Readiness endpoint: `http://<host>:5555/system/readiness` (HTTP 200 when fully initialized)

The container starts with self-signed certificates and `RELAXED` TLS mode on all endpoints so
evitaLab can connect over HTTP without certificate setup.

## Running evitaDB built from source

When the change you are verifying lives in the evitaDB working tree itself (an unreleased or
uncommitted server change — a new gRPC RPC, a converter fix), the `canary` image cannot serve it:
`canary` is built from *committed* `dev`. For that case the script has a **source mode** that builds
evitaDB from a local checkout and runs the resulting jar.

```bash
yarn evitadb:start:source     # build the jar from source + start the container
yarn evitadb:build            # build the jar only, no container lifecycle
yarn evitadb:rebuild          # build + always recreate the container
yarn evitadb:stop             # stop and remove the container (same as image mode)

yarn dev:with-evitadb:source  # source container + vite (VITE_DEV_CONNECTION=LOCAL)
```

Direct script usage:

```bash
./scripts/evitadb-server.sh start --source
./scripts/evitadb-server.sh start --source --repo /path/to/evitaDB     # explicit checkout
./scripts/evitadb-server.sh start --source --data-dir /evita-data      # reuse the canary dataset
./scripts/evitadb-server.sh start --source --no-build                  # run the jar that is in target/
./scripts/evitadb-server.sh start --source --debug 8005                 # + JDWP for a remote attach
./scripts/evitadb-server.sh build                                       # build only
./scripts/evitadb-server.sh rebuild                                     # build + force recreate
```

### Prerequisites

- **The evitaDB source tree.** Resolved as `--repo <path>` → `$EVITADB_REPO` → the sibling
  `../evitaDB` of this repository. The script fails if `evita_server/pom.xml` is not found there.
- **`mvn` on `PATH`**, running on JDK 17 or newer. If Maven is missing the script fails with the exact
  build command instead of half-starting a container — it never asks you to build in an IDE, because
  agents have no IDE. If a Maven-less environment ever has to be supported, run a dockerized Maven
  (`maven:3.9-eclipse-temurin-17`) with `-u "$(id -u):$(id -g)" -v "$HOME/.m2":/var/maven/.m2
  -Duser.home=/var/maven` and then use `--no-build`; without those flags it writes root-owned files
  into `target/` and `~/.m2` and breaks subsequent IDE builds.

### `start --source` always builds

`start --source` runs the Maven build itself:

```bash
( cd "$EVITADB_REPO" && mvn -DskipTests -DroaringBitmap.skipTests=true -pl evita_server -am package )
```

`-pl evita_server -am` builds only the server module and its upstream dependencies, and with a warm
`~/.m2` that takes well under a minute (the first ever build takes several minutes — that is not a
hang).
`evita_roaring_bitmap` pins its vendor test suite to its own `roaringBitmap.skipTests` property, which
plain `-DskipTests` does not reach, hence the second flag — this is a dev-server build, not a
verification run. The
script never runs `mvn clean` and never touches the evitaDB working tree beyond `target/`, so a
concurrent IDE build of the same module is at worst redundant.

`--no-build` skips the build and runs whatever jar is currently in `evita_server/target/` — use it
when iterating on evitaLab against an unchanged server, or when you built the jar yourself. It is the
only way to skip the build; there is no implicit jar reuse.

### How it works

Source mode runs the **published `evitadb/evitadb:<tag>` image** (the `--tag` default `canary` stays)
but bind-mounts the locally built shaded jar over the one the image ships:

```
-v <repo>/evita_server/target/evita-server.jar:/evita/bin/evita-server.jar:ro
```

The image therefore contributes only the JDK 17 runtime and the `entrypoint.sh` startup contract; all
server code comes from the working tree. Everything else — container name, port `5555`, readiness
endpoint, `VITE_DEV_LOCAL_URL` handling — is identical to image mode. This requires that the Docker
daemon shares the filesystem with the caller (true for a local daemon and for sandbox sidecars that
mount the same paths), so before starting the container the script proves it: it mounts the jar into a
throwaway container and compares the size the daemon sees with the local one. On mismatch it aborts
without touching the running container, because a path the daemon cannot see silently becomes an
empty directory inside the container. The documented workaround for such a daemon is a thin image —
`FROM evitadb/evitadb:canary` + `COPY evita-server.jar /evita/bin/` with the jar as the only build
context — run by name.

### The stale-jar trap

Bind-mounting a *file* pins its inode, and Maven's shade plugin writes a **new** file. A container
that keeps running across a rebuild therefore serves the **old** jar: readiness still reports `ready`
and your new code is simply absent, which looks exactly like "my change doesn't work".

The script handles this rather than only documenting it:

- `start --source` records the jar's path and mtime on the container
  (`io.evitalab.mode`, `io.evitalab.jar-path`, `io.evitalab.jar-mtime` labels) and **recreates** the
  container — never `docker restart` — whenever the jar it just built differs from the recorded one.
  Because the shaded jar is not reproducible (a no-op build still rewrites it), in practice **every**
  `start --source` recreates the container; that costs about four seconds to readiness and is what
  guarantees you can never be served a stale jar. A new container id after `start --source` is
  expected, not a bug. `--no-build` is the only path that reuses a running container.
- `status` prints the mode, the jar path, both mtimes and, when they differ,
  `jar: STALE (container is running an older jar - run 'rebuild')`. It also prints
  `sources: NEWER THAN JAR` when any `evita_*/src/**` file or POM is newer than the jar, so you can
  see that a running server predates your edits without starting anything.

Always check `status` before debugging a "missing RPC": it must show `mode: source` and neither of
those two lines.

### Data directory

A source build may carry unreleased storage-format changes that would rewrite — and poison — the
dataset image mode uses. Source mode therefore defaults to its own directory,
`$EVITADB_SOURCE_DATA_DIR` or `~/.evitalab/evita-data-source`, and creates it if missing. Pass
`--data-dir <path>` to override, e.g. `--data-dir /evita-data` to deliberately reuse the canary
dataset. To start from a copy of it instead:

```bash
cp -a /evita-data/. ~/.evitalab/evita-data-source/
```

### Debugging the server you just built

`--debug [port]` (default `8005`) publishes a JDWP agent, so IntelliJ can attach a remote debugger to
the source build:

```bash
./scripts/evitadb-server.sh start --source --debug
# then attach to <docker-host>:8005
```

Adding, changing or dropping `--debug` recreates the container just like a changed jar does — the
requested port is recorded in the `io.evitalab.debug-port` label and compared on every start, so the
flag can never be silently ignored on an already-running container.

Source mode also enables `api.endpoints.gRPC.exposeDocsService=true`, so a freshly added RPC can be
verified over gRPC reflection (`grpcurl`) before the evitaLab client is regenerated.

### Coupling with the generated gRPC client

The generated stubs and the running server must come from **one** source revision. When the session
also changes evitaDB's `.proto` files, regenerate the client from the same working tree first
(`generate-evitadb-client` skill), then `start --source`; otherwise evitaLab calls an RPC shape the
server does not implement. After any later proto change, regenerate and re-run `start --source`.

## Overriding the local connection URL

The `LOCAL` dev connection defaults to `http://localhost:5555`. Override it with the
`VITE_DEV_LOCAL_URL` env var when the evitaDB server is reachable at a different host —
for example, when Claude Code (or another agent) runs inside a docker sandbox with
`DOCKER_HOST=tcp://docker:2375`, containers are published on the daemon host and
reachable at `docker:5555`:

```bash
env VITE_DEV_CONNECTION=LOCAL VITE_DEV_LOCAL_URL=http://docker:5555 yarn dev
```

## Agentic development

The Claude Code skill `.claude/skills/evitadb-server/SKILL.md` codifies the agent's
decision rule (DEMO vs local `canary` image vs local source build) and container
lifecycle. Humans can invoke the same tooling via the yarn scripts above.