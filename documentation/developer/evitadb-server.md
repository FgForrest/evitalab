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
decision rule (DEMO vs LOCAL) and container lifecycle. Humans can invoke the same
tooling via the yarn scripts above.