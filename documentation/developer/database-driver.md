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
| `GraphQLSchemaCache` | Cache of built GraphQL schemas keyed by `(catalog, instanceType)` with change callbacks |
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

`queryCatalogUsingGraphQL(catalogName, instanceType, query, variables, signal?)` posts to the
server's GraphQL HTTP API (`GraphQLInstanceType.Data | Schema | System`). This is used by the
GraphQL console and the entity viewer's GraphQL query executor. The optional `signal` is threaded
into ky, so a caller can bound and genuinely cancel a request (the GraphQL console uses this to time
out schema introspection — see the GraphQL schema cache below).

#### GraphQL schema cache

The GraphQL console needs a built `graphql.GraphQLSchema` (for CodeMirror autocomplete and the schema
viewer tab), obtained via an HTTP introspection query. `GraphQLSchemaCache` caches the **built
schema** so opening or reopening N consoles for the same GraphQL API instance does not trigger N
introspections. `EvitaClient` holds a single instance and exposes:

- `getGraphQLSchema(catalogName, instanceType, signal?)` — cache-through: returns the cached schema
  or introspects (via `queryCatalogUsingGraphQL` + `buildClientSchema`) and caches it. The `signal`
  only bounds the fetch, not the cache key.
- `registerGraphQLSchemaChangedCallback(catalogName, instanceType, cb)` / `unregister…(…, id)` — the
  console listens **only** on this channel (not on the catalog-schema callbacks) to avoid double
  reloads on a catalog change.
- `clearGraphQLSchemaCache(catalogName, instanceType)` — invalidates just one entry and fires its
  callbacks; backs the console's manual "Reload GraphQL schema" button. Touches nothing else (no
  entity caches, no schema-viewer callback).

Entries are keyed by `${catalogName}:${instanceType}`, so `System`, `Data` and `Schema` are handled
uniformly (`System` uses the stable literal `system` catalog name). A catalog schema change
invalidates the derived GraphQL schemas at **both** catalog-change funnels — `clearSchemaCache`
(per catalog, when clearing the whole catalog) and `clearCache` (global) — clearing the catalog's
`Data` + `Schema` entries and firing their callbacks so open consoles auto-reload once. The `System`
instance is **not** catalog-scoped and is therefore refreshed only through the manual button.

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
| `REFERENCE_SCHEMA` | `ReferenceAttributeSchema` | yes |
| `GLOBAL_SCHEMA` | `GlobalAttributeSchema` | yes (+ global uniqueness) |

`ReferenceAttributeSchema` mirrors `EntityAttributeSchema`: it carries the `representative` flag (delivered
by gRPC but previously dropped when reference attributes were built as the plain base `AttributeSchema`) and
contributes the representative badge through the `prefixFlags()` hook. The flag drives grouping/filtering of
references in the entity-viewer detail. Older servers that don't send the flag report `representative = false`,
so those details fall back to a flat, unfiltered list.

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
- `EvitaClient.registerGraphQLSchemaChangedCallback(catalogName, instanceType, cb)` — GraphQL schema
  cache (see [GraphQL schema cache](#graphql-schema-cache) above)
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

`EvitaClient.clearCache()` clears **all** client caches — catalog statistics, sessions, schemas
(internal and GraphQL) and the server metadata cache too. It clears the **server metadata cache first**, so the
server-status reachability signal is refreshed before the catalog-statistics cache; consumers
reacting to the catalog change callback (e.g. the connection panel) can then check the server
status and skip catalog reloads that would only fail against an unreachable server. Because it
clears the server metadata cache, it also fires the server-status change callbacks, which is what
re-enables the connection panel's server-related menu actions after the server recovers (see the
connection-explorer module).

## System CDC & DataCacheRefresher

evitaLab keeps its client-side caches in sync with the server through a single always-open
**system change-data-capture (CDC)** stream. Engine-level mutations (catalog
create/drop/rename/state/mutability/schema changes) are pushed by the server and used to invalidate
the corresponding caches, so the explorer panel, schema viewers and consoles refresh themselves
without any extra plumbing — they just keep using the existing change callbacks above.

### The typed stream API

`EvitaClient.registerSystemChangeCapture(options?)` is an async generator yielding internal
`RegisterSystemChangeCaptureResponse` objects (not raw gRPC types). It always requests the full
change body (the body carries the catalog name needed for targeted invalidation). Options:

- `sinceVersion?: bigint` / `sinceIndex?: number` — resume point (replays mutations missed during an
  outage);
- `signal?: AbortSignal` — cancel the stream deterministically.

The protocol: the first response is an **acknowledgement** (with heartbeat info), then **change**
responses (each carrying a `ChangeSystemCapture` whose `body` is the converted engine mutation) and
periodic **heartbeat** responses (carrying `lastObservedVersion` and `millisToNextHeartbeat`). The
stream is meant to be consumed by a single consumer — `DataCacheRefresher`.

### DataCacheRefresher

`DataCacheRefresher` (injectable, `useDataCacheRefresher()`) is constructed and `start()`-ed right
after `EvitaClient` in `DatabaseDriverModuleRegistrar`. It guarantees **exactly one** open stream at
a time via a single sequential loop, and it is fully self-healing:

- stream creation/consumption failures never crash the app — every error is caught, the status flips
  to `Broken`, and the loop reconnects with a capped backoff (5s → 10s → 20s → 60s);
- normal stream completion is treated as a failure so the reconnect path runs;
- a **heartbeat watchdog** (`setTimeout(abort, max(2 × millisToNextHeartbeat, 30s))`, reset on every
  message) aborts zombie streams that neither error nor complete; when the server advertises
  `millisToNextHeartbeat` the `2 × interval` term dominates, so the 30s floor only bites for a stream
  that never sends a heartbeat at all — exactly the zombie case;
- on reconnect it resumes from the last observed engine version (`sinceVersion`); if a resume attempt
  is never acknowledged, it falls back to a fresh subscription plus a defensive
  `clearCatalogStatisticsCache()`.

There is **no notification toast** — the Toaster is not yet available during module registration, so
the status-bar indicator (`ChangeStreamIndicator.vue`, fed by the refresher's reactive
`streamStatus` / `lastChangeAt` refs) is the sole user-facing signal. Failures are `console.warn`-ed
for diagnosability.

Cache invalidation is coarse but cheap — it dispatches on the concrete class of the converted
mutation `body`:

| Engine mutation | Invalidation |
|---|---|
| `CreateCatalogSchemaMutation`, `DuplicateCatalogMutation`, `RestoreCatalogSchemaMutation` | `clearCatalogStatisticsCache()` |
| `RemoveCatalogSchemaMutation` | `clearCatalogStatisticsCache()` + `clearSchemaCache(catalogName)` |
| `ModifyCatalogSchemaNameMutation` | `clearCatalogStatisticsCache()` + `clearSchemaCache(oldName)` + `clearSchemaCache(newName)` |
| `ModifyCatalogSchemaMutation` | `clearSchemaCache(catalogName)` + `clearCatalogStatisticsCache()` |
| `MakeCatalogAliveMutation`, `SetCatalogStateMutation`, `SetCatalogMutabilityMutation` | `clearCatalogStatisticsCache()` |
| `TransactionMutation` | none (no catalog reference) — updates `lastChangeAt` only |
| unknown / header-only (`body == undefined`) | none — updates `lastChangeAt` only |

Mutations performed by evitaLab itself are echoed back through the stream; because those operations
already clear the relevant caches explicitly, the echoed invalidation is an idempotent no-op.

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
