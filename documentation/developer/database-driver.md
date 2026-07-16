# Database driver (`database-driver` module)

All communication with an evitaDB server goes through the `database-driver` module. Its public face
is the `EvitaClient` class — **the single entrypoint for every database call**. No other module may
talk to the server directly (no raw gRPC/HTTP calls).

```ts
// in components
const evitaClient: EvitaClient = useEvitaClient()

// in module registrars
const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
```

In practice the client should be used from **services**, not directly from components (unless the
logic is tiny) — see [guidelines](guidelines.md).

## Design

The client is modeled after the evitaDB Java/C# drivers, simplified for evitaLab needs
(`src/modules/database-driver/`):

| Class | Responsibility |
|-------|----------------|
| `AbstractEvitaClient` | Lazily-built gRPC transport ([connect-web](https://connectrpc.com/)), gRPC service clients (`EvitaService`, `EvitaManagementService`, `EvitaSessionService`, `EvitaTrafficRecordingService`), HTTP client ([ky](https://github.com/sindresorhus/ky)) for GraphQL API, converter singletons, `ErrorTransformer` |
| `EvitaClient` | Catalog-level operations (list/create/rename/replace/delete/duplicate…), session orchestration (`queryCatalog`, `updateCatalog`), GraphQL passthrough (`queryCatalogUsingGraphQL`), schema-cache management, change callbacks |
| `EvitaClientSession` | Session-scoped operations: `query()` (evitaQL), schema access (`getCatalogSchema()`, `getEntitySchema()`), collection management, backups, traffic recording, mutation history, labels, `close()` |
| `EvitaClientManagement` | Server-level operations: server status, configuration, catalog statistics, backup/restore, file listing/download, task monitoring, with its own caches + change callbacks |
| `EvitaSchemaCache` | Per-catalog cache of catalog/entity schemas with change callbacks |
| `EvitaServerMetadataCache`, `EvitaCatalogStatisticsCache` | Caches for server metadata and catalog statistics |

## Sessions

Sessions are expensive; evitaLab deliberately deviates from other drivers:

- **`queryCatalog(catalogName, sessionLogic)`** — runs the logic against a **shared read-only
  session per catalog**. The session is reused by subsequent calls (saves server resources; most
  reads are schema fetches that are cached anyway). `forceNewSession: true` requests a fresh
  session, which then becomes the new shared one.
- **`updateCatalog(catalogName, updateLogic)`** — creates a **new short-lived read-write session**
  for each call, closes it afterwards, and also terminates the shared read-only session for the
  catalog so subsequent reads see fresh data.
- **Warm-up catalogs** (`CatalogStatistics.isInWarmup`) are special: evitaDB supports only a single
  session in warm-up state, so both methods share one session and never force new ones.

```ts
const response: EvitaResponse = await evitaClient.queryCatalog(
    catalogName,
    async (session) => await session.query(query)
)

await evitaClient.updateCatalog(
    catalogName,
    async (session) => await session.createCollection(entityType)
)
```

Never hold a session reference outside the logic function — a shared session may be closed and
replaced at any time (the client retries logic on closed sessions automatically).

### GraphQL access

`queryCatalogUsingGraphQL(catalogName, instanceType, query, variables)` posts to the server's
GraphQL HTTP API (`GraphQLInstanceType.Data | Schema | System`). This is used by the GraphQL
console and the entity viewer's GraphQL query executor.

## Internal model (request-response)

The generated gRPC model is not used outside the driver. Every gRPC message is converted into an
**internal evitaLab model** under `request-response/` (entities, schemas, tasks, traffic
recordings, CDC, server files, …), which mostly mirrors evitaDB's data model. Rules:

- Converters live in `connector/grpc/service/converter/` and are exposed as lazy getters on
  `AbstractEvitaClient`.
- Internal model classes are immutable and use Immutable.js collections.
- evitaDB scalar types have dedicated wrappers in `data-type/` (`BigDecimal`, `DateTimeRange`,
  `LocalDate(Time)`, `OffsetDateTime`, `Locale`, `Currency`, `Uuid`, `Predecessor`, ranges, …).
  Use these — not raw JS types — when representing evitaDB values.
- Generated protobuf/gRPC sources live in `connector/grpc/gen/` and are **never edited manually**;
  they are regenerated from the evitaDB repo (see `buf.gen.yaml`; agents can use the
  `generate-evitadb-client` skill).

### Attribute schema model mapping

`CatalogSchemaConverter.convertAttributeSchema` picks the internal attribute-schema class from the
gRPC `GrpcAttributeSchemaType` discriminator — the mapping must stay in sync with evitaDB's model
(a swap here silently drops or fabricates the `representative` property and hits the wrong
`representativeFlags` implementation):

| `GrpcAttributeSchemaType` | Internal class | Has `representative` |
|---|---|---|
| `ENTITY_SCHEMA` | `EntityAttributeSchema` | yes |
| `REFERENCE_SCHEMA` | `AttributeSchema` (base) | no |
| `GLOBAL_SCHEMA` | `GlobalAttributeSchema` | yes (+ global uniqueness) |

## Caching & change callbacks

Schemas, server status, configuration and catalog statistics are cached client-side. When a UI
component needs to react to changes, register a callback and **always unregister it on unmount**:

```ts
let callbackId: string
onMounted(() => {
    callbackId = evitaClient.registerCatalogSchemaChangedCallback(
        catalogName,
        async () => await reload()
    )
})
onUnmounted(() => {
    evitaClient.unregisterCatalogSchemaChangedCallback(catalogName, callbackId)
})
```

Available callback registries:

- `EvitaClient.registerCatalogSchemaChangedCallback(catalogName, cb)` /
  `registerEntitySchemaChangedCallback(catalogName, entityType, cb)`
- `EvitaClientManagement.registerServerStatusChangeCallback(cb)`,
  `registerConfigurationChangeCallback(cb)`, `registerCatalogStatisticsChangeCallback(cb)`

Mutating operations invalidate the relevant caches themselves (e.g. `renameCatalog` drops the
schema cache). If you add a new mutating call, make sure it clears affected caches
(`clearSchemaCache`, `clearCatalogStatisticsCache`, `terminateSharedSession`, …).

### Invalidation vs. refresh

`EvitaServerMetadataCache` exposes two distinct ways to get fresh data, and they differ in when the
change callbacks fire:

- **`clear()`** (via `EvitaClientManagement.clearServerMetadataCache()`) — drops the cached server
  status/configuration and immediately fires the change callbacks. The next read re-fetches. Note
  that failed fetches are **not** sticky: when an accessor throws, nothing is cached, so the next
  read simply tries again.
- **`refreshServerStatus()` / `refreshConfiguration()`** (via the same-named
  `EvitaClientManagement` wrappers) — fetch fresh data first, then swap the cached value and fire
  the callbacks (fetch → swap → notify). On fetch failure the exception propagates and neither the
  cached value nor the callbacks are touched. Prefer this over `clear()` for periodic polling: it
  avoids the window in which concurrent readers would otherwise see an empty cache and double-fetch.
  `ServerViewerService.getServerStatus(forceRefresh)` / `getRuntimeConfiguration(forceRefresh)` pick
  between the cached read and the refresh path.

`EvitaClient.clearCache()` clears **all** client caches — catalog statistics, sessions, schemas and
now the server metadata cache too. It clears the **server metadata cache first**, so the
server-status reachability signal is refreshed before the catalog-statistics cache; consumers
reacting to the catalog change callback (e.g. the connection panel) can then check the server
status and skip catalog reloads that would only fail against an unreachable server. Because it
clears the server metadata cache, it also fires the server-status change callbacks, which is what
re-enables the connection panel's server-related menu actions after the server recovers (see the
connection-explorer module).

## Long-running operations

Some server operations report progress as async iterables (e.g.
`duplicateCatalogWithProgress`, `renameCatalogWithProgress`, `deactivateCatalogWithProgress`) —
consume them with `for await`. Others return a `TaskStatus` and are tracked via the task
infrastructure (`request-response/task/`, surfaced by the `task-viewer` module).

## Error handling

Every driver call wraps errors through `ErrorTransformer.transformError(e)`, converting transport
errors into evitaLab error types derived from `LabError` (`modules/base/exception/`). Callers
(services/components) therefore catch evitaLab errors, not gRPC errors — display them via
`useToaster().error(title, error)` (see [guidelines](guidelines.md#error-handling)).

## Connection

The `connection` module supplies the single active `Connection` (id, name, `serverUrl`, with
derived `grpcUrl`/`graphQlUrl`/`restUrl`) via `ConnectionService`. It is resolved at startup from
(in priority order):

1. `connection` system property (JSON, provided by evitaLab Desktop in driver mode),
2. `pconnections` preconfigured-connections system property (first entry wins),
3. in dev mode, the `VITE_DEV_CONNECTION` env variable — `DEMO` (default, `https://demo.evitadb.io`)
   or `LOCAL` (Dockerized server, see [evitaDB server](evitadb-server.md)).

evitaLab currently supports exactly **one connection per instance**; multi-connection UX is handled
by evitaLab Desktop, which spawns one driver instance per connection.
