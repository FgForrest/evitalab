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
| `AbstractEvitaClient` | Lazily-built gRPC transport ([connect-web](https://connectrpc.com/)) with the `clientVersion` interceptor (see [associated data & complex data objects](#associated-data--complex-data-objects)), gRPC service clients (`EvitaService`, `EvitaManagementService`, `EvitaSessionService`, `EvitaTrafficRecordingService`), HTTP client ([ky](https://github.com/sindresorhus/ky)) for GraphQL API, converter singletons, `ErrorTransformer` |
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
  for each call, closes it afterwards, and also evicts the shared read-only session for the
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
replaced at any time. This rule is what makes the eviction and recovery below sound: the client can
only tell when a session is unused because every use is bracketed by a logic function.

#### Eviction and draining

Every path that "closes" the shared session of a catalog (`forceNewSession`,
`terminateSharedSession`, `closeSharedSession`, `clearSchemaCache`, `clearCache`) **evicts** it
rather than killing it:

1. the session is removed from the registry, but only if the registry still holds *that* session — a
   concurrent creation may have already installed a newer one, which must not be dropped;
2. the session itself is closed only once its in-flight callers are done (it is reference-counted via
   `acquire()` / `release()`).

Closing a session that another call is still executing on is what evitaDB answers with *"Evita
session has been already terminated!"*, so the client never does it. The pending close is **not**
awaited by the evicting caller — someone asking for fresh data must not block on an unrelated slow
query. Warm-up catalogs are the exception: evitaDB permits exactly one open session there, so
creating the next shared session waits for the outstanding close to finish.

#### Recovery

If logic still fails on a session that the client evicted in the meantime, the client **replays it
once** on a fresh session. The decision is based on the client's own knowledge (was this session
already evicted or closed when the logic failed?), *not* on the error — evitaDB reports a call on a
terminated session as an ordinary invalid-usage error, indistinguishable from a malformed query.
Mutating logic is never replayed, because it may have been partially applied. A session the **server**
dropped on its own (e.g. on the inactivity timeout) reports itself as unauthenticated and is retried
on that signal. When even the retry fails, a `SessionRetryFailedError` carrying the original failure
is thrown.

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

### Associated data & complex data objects

`GrpcEvitaAssociatedDataValue` carries a **oneof** with three mutually exclusive forms:

| oneof case | payload | meaning |
|---|---|---|
| `primitiveValue` | `GrpcEvitaValue` | plain (non-complex) associated data value |
| `jsonValue` | `string` | **deprecated** — a complex data object flattened into a JSON string (lossy) |
| `root` | `GrpcDataItem` | a complex data object as a typed tree (`primitiveValue` / `arrayValue` / `mapValue` recursion) |

Which of the two complex forms arrives is negotiated: evitaDB picks the structured tree only for
clients declaring evitaDB API version `2025.4` or newer through the `clientVersion` gRPC header.
evitaLab declares it from `.evitadbrc` in a transport interceptor
(`AbstractEvitaClient.transport` + `connector/grpc/utils/ClientVersion.ts`), so **one interceptor covers
all four service clients**, unary and streaming alike. Only a version evitaDB can parse
(`major.minor[.patch][-SNAPSHOT]`) may be sent — the server parses the header without any error handling,
so a malformed value would break *every* gRPC call; `resolveClientVersion()` therefore drops anything else
and the server falls back to the deprecated form. **Both branches are live** — older servers keep answering
`jsonValue` — and neither may be dropped until the supported-server floor moves past the JSON form.

The `type` discriminator stays `COMPLEX_DATA_OBJECT` in **both** complex forms, therefore
**dispatch must key off the oneof case, never off `type`** — `EvitaValueConverter.convertGrpcAssociatedValue`
is the single dispatch point for both entry points (entity reads in `EntityConverter`, and
`UpsertAssociatedDataMutation` in traffic/history). `ScalarConverter.convertAssociatedDataScalar` legitimately
keys off `type`, because the associated data scalar is `ComplexDataObject` either way.

`EvitaValueConverter.convertGrpcDataItem` converts the tree into a **plain JSON-compatible structure** —
maps to plain objects, arrays to plain arrays, leaves to plain JSON values. This is a deliberate exception
to the "use the `data-type/` wrappers, not raw JS types" rule above: complex data objects are rendered by
a bare `JSON.stringify` (entity grid renderers, `MutationHistoryDataVisualiser`), which throws on `bigint`
and would serialize the wrappers as their internal fields. The leaf projection reproduces evitaDB's
`ComplexDataObjectToJsonConverter`, so the structured form renders exactly like the JSON form:

| evitaDB type | projection |
|---|---|
| `BYTE`, `SHORT`, `INTEGER`, `BOOLEAN` | JSON number / boolean |
| `LONG`, `BIG_DECIMAL` | JSON **string** (ECMAScript numbers cannot hold the whole range / precision) |
| `STRING`, `CHARACTER`, `LOCALE` | unquoted JSON string (locale as a language tag) |
| `CURRENCY`, `UUID` | JSON string wrapped in apostrophes (`'CZK'`) — an evitaDB formatting wart, kept for display parity |
| date/times | ISO strings with millisecond precision, built from the sent offset (never from the local time zone) |
| ranges, predecessors | `[from,to]` / `toString()` |
| null leaf | JSON `null` — a leaf holding no value arrives as an empty `GrpcEvitaValue` |

Known deviations from the JSON form: `BIG_DECIMAL` is passed through in the wire form (`E` normalized to
`e`) instead of `toPlainString()`, date/times are truncated to milliseconds, predecessors use evitaLab's own
`Predecessor.toString()` (`Head` / the predecessor id) rather than evitaDB's, and a bare primitive root is
converted leniently (the JSON form rejects it). Nulls have two distinct shapes and only the first survives
the structured form: a **leaf holding null** is sent as a present item with an empty value message (→ `null`,
as in the table above), whereas a map property that is a **null item** is skipped by the server when it builds
the tree, while the JSON form emitted an explicit `null` for it. That second difference is produced
server-side and cannot be compensated by the client.

`convertGrpcDataItem` throws `UnexpectedError` on an unrecognized item, mirroring the Java driver. The
"nested delegating converters must never throw" rule below applies to *schema* mutation converters on the
`ChangeSystemCaptureConverter` path; associated data upsert is a local entity mutation and is not on it.

### Transaction conflict resolution

evitaDB's write-conflict policy is declared at several schema levels and inherited downward. The driver
carries the **declared** values only — which level wins is derived in the
[`schema-viewer`](modules/schema-viewer.md#conflict-resolution-rows), because the schema API returns no
"which level won" marker.

| Internal model | Field | Shape |
|---|---|---|
| `CatalogSchema`, `EntitySchema` | `conflictResolution: ConflictResolution \| undefined` | `undefined` ⇒ the level declares nothing and inherits |
| `AttributeSchema` (+ all subclasses), `AssociatedDataSchema`, `ReferenceSchema` (+ `ReflectedReferenceSchema`) | `conflictResolutionOverride: ConflictResolutionOverride` | non-null enum whose `Inherited` value is the "not set" sentinel |

`ConflictResolution` pairs a coarse `ConflictPolicy` (`None`/`Catalog`/`Collection`/`Entity`) with a
`List<GranularConflictPolicy>` of refinements (non-empty only under `Entity`).

**The base of the inheritance chain is not a constant.** The engine-wide default is server configuration, so
it is read from `EvitaClientManagement.getEngineSettings()` (`EvitaManagementService.GetEngineSettings` →
`EngineSettings`, which also reports whether time travel, CDC, traffic recording and the query cache are
enabled). Never hardcode `Entity` as the default — a differently configured server reports something else.
Engine settings are constant for the lifetime of the server process, so `EvitaServerMetadataCache` caches
them like server status and configuration, but without change callbacks: they can only change by
reconnecting, which clears the whole cache.

`ConflictResolutionConverter` maps all four enums and the optional message. **The two shapes must be
converted differently**: an absent `GrpcConflictResolution` message becomes `undefined`, while an absent
per-item enum (a server that predates the field) degrades to `Inherited`. Every construction site in
`CatalogSchemaConverter` passes these values as trailing constructor arguments; they default to
"inherits", so a forgotten pass-through degrades silently rather than throwing — the converter test
covers each attribute subclass for that reason.

### Mutation history paging (`getMutationHistory`)

`EvitaClientSession.getMutationHistory` returns a `MutationHistoryPage`
(`request-response/cdc/MutationHistoryPage.ts`), not a plain list:

| Field | Meaning |
|---|---|
| `records` | what the viewer renders — the streamed captures with transaction overviews merged in |
| `captureCount` | number of **streamed** captures only; the basis for pagination and "load more" |

The two must not be conflated. `records.size` routinely exceeds the requested page size because of the
merged overviews, so deciding "is there another page?" from it keeps the button visible forever.

**The API is reverse-only and has no lower bound.** `GetMutationsHistoryPageRequest.sinceVersion` is an
**upper** bound: the server starts a reverse (newest → oldest) scan there and clamps the value to the
current catalog version, so it cannot express "records newer than X". That bound is therefore the
client's job by design (evitaDB#1349, agreed with the evitaDB team — no forward RPC is coming):
`MutationHistoryRequest.newerThanVersion` is applied here via `truncateBelowBoundary()`, a
prefix-preserving `takeWhile` over the reverse-ordered captures. It runs **before** the catalog-version
list is built, so overviews are never fetched for versions that are about to be discarded; when
truncation empties the page, `getTransactionOverview` is skipped entirely (an empty version list would
otherwise ask for everything).

**`sinceIndex` must always be sent together with `sinceVersion`.** Unset, the server reads it as `0`,
which in the reverse direction starts at the anchor version's transaction lead event and skips the rest
of that version. Send `reverseScanStartIndex` (`Integer.MAX_VALUE`); it is correct on every server
generation.

**The local transaction-overview merge must stay.** A transaction's header is streamed once per
transaction group, so pages beyond the first do not carry the header of the transaction their first
capture belongs to — `getTransactionOverview` compensates for that, and it is only safe to drop once the
server emits record-aligned pages. `mergeTransactionOverviews()` interleaves overviews by catalog
version (they used to be prepended as one block) and lets each lead its own version, matching the
`index = 0` lead-event contract the `history-viewer`'s visualisation processor groups by.

**Transaction records are distinguished by provenance, not by body type.** `body instanceof
TransactionMutation` is not a discriminator: a stream-delivered infrastructure capture converts to a
`TransactionMutation` exactly like the synthesised overviews do. Only this method knows which records
came from `response.changeCapture`, which is why `captureCount` is reported from here rather than
recomputed upstream.

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

**Every schema change arrives wrapped in `ModifyCatalogSchemaMutation`** — a catalog-level change nests a
local catalog mutation, an entity-level change nests `ModifyEntitySchemaMutation`, and an item override
nests deeper still. Eviction keys off the wrapper's `catalogName` alone and never inspects the nested
mutations, which is why the **nested delegating converters must never throw**
(`DelegatingLocalCatalogSchemaMutationConverter`, `DelegatingEntitySchemaMutationConverter`,
`DelegatingAttributeSchemaMutationConverter`). A single unconvertible nested mutation used to abort the
whole body conversion; `ChangeSystemCaptureConverter`'s last-resort catch then degraded the capture to
header-only, and the row above shows what that costs: **no schema-cache eviction at all**, so the UI kept
serving a stale schema. Unknown nested mutations therefore degrade to `UnknownSchemaMutation` (which keeps
the nested-mutation count honest for the history viewer) and the wrapper still evicts.

For the same reason each delegating registry is **built on first use, not at class initialisation**: the
converter modules form import cycles (a mutation contains mutations that delegate back), and a statically
initialised map captures `undefined` for whichever module the bundler evaluates first.

## Long-running operations

Some server operations report progress as async iterables (e.g.
`duplicateCatalogWithProgress`, `renameCatalogWithProgress`, `deactivateCatalogWithProgress`) —
consume them with `for await`. Others return a `TaskStatus` and are tracked via the task
infrastructure (`request-response/task/`, surfaced by the `task-viewer` module). To follow one known
task without listing all of them, `EvitaClientManagement.getTaskStatus(taskId)` polls a single task;
it returns `undefined` once the server no longer knows the task, which callers must treat as a
terminal state (the traffic-viewer's export button does).

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
