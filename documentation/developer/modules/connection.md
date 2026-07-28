# `connection` — connection to an evitaDB server

Generic module, registered third. evitaLab talks to exactly **one** evitaDB server at a time; this
module decides which.

- **Provides:** `connectionServiceInjectionKey` → `ConnectionService`
- **Injects:** `evitaLabConfigInjectionKey`

## Contents

| File | Purpose |
|------|---------|
| `model/Connection.ts` | The connection model (name, server URL, …) |
| `model/ConnectionId.ts` | Connection identity |
| `service/ConnectionService.ts` | Resolves the single active connection |
| `exception/ConnectionNotFoundError.ts` | Requested connection does not exist |
| `exception/DuplicateConnectionError.ts` | Two connections claim the same identity |
| `workspace/status-bar/model/subject-path-status/ConnectionSubjectPath.ts` | Status-bar breadcrumb rooted at the connection — what tabs return from `TabComponentExpose.path()` |

## Resolution order

`ConnectionService` resolves the active connection from, in order:

1. **system properties** — `evitalab-connection=<base64 of {"id","name","serverUrl"}>` on the URL
   (see [`config`](config.md)); this is how a host injects a connection into a production build
2. **preconfigured connections**
3. **`VITE_DEV_CONNECTION`** — dev mode only (`DEMO` or `LOCAL`, the latter with
   `VITE_DEV_LOCAL_URL`); see [evitaDB server](../evitadb-server.md)

## Note on `workspace/` inside this module

`ConnectionSubjectPath` lives here rather than in `workspace` so the status-bar breadcrumb type that
*knows about connections* stays with the connection model — `workspace` owns the generic `SubjectPath`
abstraction. Feature modules import `ConnectionSubjectPath` from here when implementing
`TabComponentExpose.path()`.

## Related

- [`config`](config.md) — where system properties come from
- [`database-driver`](database-driver.md) — consumes the resolved connection
- [evitaDB server](../evitadb-server.md) — dev-mode backends
- [workspace & tabs](../workspace-and-tabs.md) — `path()` and the status bar
