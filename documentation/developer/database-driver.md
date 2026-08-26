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
| `cache/PersistentCacheLayer` | On-disk (L2) half of the caches above — encoding, hydration and revalidation of persisted server data (see [persistent cache](#persistent-cache-l2)) |

## Deadlines & cancellation

Ported from the official evitaDB **Java driver** (`io.evitadb.driver.config.ClientTimeoutOptions`): a
client-wide default deadline, an explicit opt-up for the few genuinely slow calls, and cancellation kept as a
separate concept. Both constants live in `AbstractEvitaClient.ts`:

| Class | Constant | Where it is set | Calls |
|---|---|---|---|
| **Default (metadata)** | `defaultCallTimeout` = 15 s | `createGrpcWebTransport({ defaultTimeoutMs })` **and** `ky.create({ timeout })` | everything not listed below — schemas, statistics, session creation, listings, GraphQL introspection, the JFR observability endpoints¹ |
| **Extended (user queries)** | `userQueryTimeout` = 300 s | explicit `timeoutMs` / `timeout` at the driver call site | the call sites enumerated below |
| **Streams** | `unboundedStreamOptions` (`{ timeoutMs: 0 }`) | every streaming call site | the 10 call sites enumerated below |

**Nothing above the driver ever passes a timeout.** A UI service calls
`evitaClient.queryCatalog(...)` with no timeout argument; `EvitaClientSession` attaches the extended
`timeoutMs` because *it* knows which gRPC method is a query. The classification is per gRPC method, decided in
the driver, so no signature outside `database-driver` mentions deadlines. `AbortSignal` survives only for
**deliberate cancellation** (`DataCacheRefresher`'s heartbeat watchdog, `fetchFileStream`), which is a different
concept with a different error code (`Code.Canceled` vs `Code.DeadlineExceeded`).

`EvitaClientSession.callOptions(timeoutMs)` widens the session's call metadata with a deadline for one call.

¹ The three JFR observability endpoints (`getRecordingEventTypes`, `startRecording`, `stopRecording`) were
*inspected and judged* fast rather than measured — they are the HTTP calls that dropped from ky's former
client-wide 5 minutes to 15 s. `startRecording` on a loaded JVM is the plausible exception; if JFR start/stop
ever trips the bound, give those calls an explicit `timeout: userQueryTimeout`, exactly as
`queryCatalogUsingGraphQL` has.

**Extended-timeout call sites** — a miss here breaks a working feature at 15 s:

- `EvitaClientSession.query()` (evitaQL console **and** the entity grid)
- `EvitaClientSession.getMutationHistory()` (both `getMutationsHistoryPage` and `getTransactionOverview`)
- `EvitaClientSession.getRecordings()` (both the forward and reversed variants)
- `EvitaClientSession.getLabelNamesOrderedByCardinality()` / `getLabelValuesOrderedByCardinality()` —
  cardinality scans over the whole recording buffer
- `EvitaClientSession.goLiveAndClose()`
- `EvitaClient.queryCatalogUsingGraphQL()` — see [GraphQL access](#graphql-access) for why this one *defaults*
  to the extended timeout and the introspection caller opts back down
- `EvitaClientManagement.restoreCatalogUnary()` — already carried its own `{ timeoutMs: fileChunkUploadTimeout }`

Verified to need **nothing**: `backupCatalog`, `fullBackupCatalog` and `exportTrafficRecording` return a queued
`TaskStatus` immediately rather than doing the work inline, so they stay at the default.

**Streams must opt out.** connect-web applies `defaultTimeoutMs` to `stream()` as well as `unary()`, and
`timeoutMs` is a *whole-call* deadline — so a healthy long-lived stream would be killed the moment it expires.
**Rule: any new streaming gRPC call must pass `unboundedStreamOptions`.** Nothing enforces this mechanically —
a forgotten opt-out compiles, type-checks and passes tests, and only breaks at runtime once the transfer
outlives 15 s. The current 10 sites: the eight `*WithProgress` catalog operations and
`registerSystemChangeCapture` in `EvitaClient`, and `fetchFile` in `EvitaClientManagement`.

Note what the opt-out does *not* do: it removes the deadline without replacing it. The Java driver instead
re-arms a **per-message** deadline (`streamingTimeout`, 300 s, reset after every received message), which
connect-web's whole-call `timeoutMs` cannot express. evitaLab's only equivalent is `DataCacheRefresher`'s
heartbeat watchdog on the system-CDC stream; the other nine streams have none — a pre-existing gap.

**Worst case is not a single deadline.** One `queryCatalog` can be up to three sequential bounded calls
(catalog statistics → session creation → the logic), i.e. ~45 s, and ~90 s if the single `Unauthenticated`
session retry also fires. Against a fully hung server the first call absorbs the deadline and the caller fails
at ~15 s; only a selectively hung server reaches the multiples.

**Schema fetches deliberately keep the 15 s default.** `fetchLatestCatalogSchema` / `fetchLatestEntitySchema`
sit on the init critical path of the schema viewer and entity viewer tabs, and they are metadata — the Java
driver bounds the same calls at 5 s. If a large catalog ever proves slower than 15 s over gRPC-web, the fix is
an explicit larger `timeoutMs` on those two call sites, **not** a raised global: raising the global would
un-bound every other metadata call again.

**A deadline counts as an outage signal.** `isConnectivityError` treats `Code.DeadlineExceeded` as
"server unreachable", so a call that exceeds its deadline flips evitaLab into
[offline state](#offline-state--is-evitalab-offline). This is intentional — a metadata call that cannot answer
in 15 s *is* an unresponsive server — and it is self-healing: the next successful response on either transport
clears it.

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

#### Lazy materialization

A session object is a **cheap local shell**. `createSession` performs no network call at all; the gRPC
`CreateReadOnlySession` / `CreateReadWriteSession` happens on the first call that genuinely *needs* the
server (`EvitaClientSession.materialize()`, reached through the internal `callMetadata()` that every
server-touching method obtains its call metadata from). Consequences:

- **Reads answered from a cache never open a server session.** Opening a tab that only browses cached
  schemas costs the server nothing, and — the reason this exists — a schema can be served from the
  [persistent cache](#persistent-cache-l2) while the server is unreachable. Before this, every
  `queryCatalog` died in the eager `createSession` long before any cache was consulted.
- **Materialization is single-flighted**: N concurrent calls on one shell produce exactly one server
  session. A *failed* attempt is forgotten, so a later call retries against a server that has recovered.
- **`getOrCreateSharedSession` is synchronous**, and that is load-bearing: because a shell needs no
  network, it is installed into the shared-session registry in the same tick, which makes the registry
  itself the dedup of shared-session creation. (The former `sharedSessionsInCreation` single-flight
  registry existed only to cover the `await` that used to sit there, and is gone.) **Never introduce an
  `await` between entry into that method and `sharedSessions.set(...)`** — every caller missing the
  registry in the same tick would then install a session of its own, leaking all but the last on an alive
  catalog and outright failing on a warming-up one.
- **The warm-up close-wait moved into the materializer.** evitaDB permits one open session on a
  non-transactional catalog, so the wait for an outstanding close belongs at the moment a *server* session
  is opened, not at shell creation.
- **A shell that never materialized closes purely locally** — there is nothing to close server-side. A
  close racing an in-flight materialization awaits its outcome first, so a session that did get created is
  never leaked. A shell that has been closed *refuses* to materialize (that would leak a session nobody can
  close any more); the resulting `InstanceTerminatedError` is exactly the signal the recovery below replays
  on a fresh session.
- `session.id` is `string | undefined` (absent until materialized). **Use `session.debugId`** — a stable
  client-generated uuid — in log messages.

> **Behavioural consequence for session logic.** When the server is down, `queryCatalog` no longer fails
> *before* the logic runs; the logic now executes its cache-served prefix and throws at the first call that
> touches the network. Session logic must therefore be **side-effect-free until it has its data** — already
> required by the replay path below, which re-executes that prefix, and now also by offline operation.

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

`queryCatalogUsingGraphQL(catalogName, instanceType, query, variables, timeout?)` posts to the
server's GraphQL HTTP API (`GraphQLInstanceType.Data | Schema | System`). This is used by the
GraphQL console and the entity viewer's GraphQL query executor.

`timeout` defaults to `userQueryTimeout` because this is *semantically* the user-query method — every caller
outside the class runs a document the user wrote. The direction is therefore inverted relative to gRPC: the one
internal caller that is **not** a user query (`fetchGraphQLIntrospection`) opts back *down* to
`defaultCallTimeout`. Defaulting the other way round would force both UI call sites to pass a timeout, pushing
the classification out of the driver — see [deadlines & cancellation](#deadlines--cancellation).

#### GraphQL schema cache

The GraphQL console needs a built `graphql.GraphQLSchema` (for CodeMirror autocomplete and the schema
viewer tab), obtained via an HTTP introspection query. `GraphQLSchemaCache` caches the **built
schema** so opening or reopening N consoles for the same GraphQL API instance does not trigger N
introspections. `EvitaClient` holds a single instance and exposes:

- `getGraphQLSchema(catalogName, instanceType)` — cache-through: returns the cached schema
  or introspects (via `queryCatalogUsingGraphQL` + `buildClientSchema`) and caches it. The introspection is
  bounded by `defaultCallTimeout` like any other metadata call.
- `registerGraphQLSchemaChangedCallback(catalogName, instanceType, cb)` / `unregister…(…, id)` — the
  console listens **only** on this channel (not on the catalog-schema callbacks) to avoid double
  reloads on a catalog change.
- `refreshGraphQLSchema(catalogName, instanceType)` — backs the console's manual "Reload GraphQL
  schema" button. Re-introspects **first** and swaps + notifies only when the result really changed, so a
  reload that cannot reach the server keeps the schema the console is browsing; see
  [manual refresh](#manual-refresh-fetch-first-never-clear).
- `clearGraphQLSchemaCache(catalogName, instanceType, reason)` — invalidates just one entry and fires its
  callbacks. Touches nothing else (no entity caches, no schema-viewer callback). Reserved for callers that
  *know* the schema changed — the reload button must not use it.

Entries are keyed by `${catalogName}:${instanceType}`, so `System`, `Data` and `Schema` are handled
uniformly (`System` uses the stable literal `system` catalog name). A catalog schema change
invalidates the derived GraphQL schemas at **both** catalog-change funnels — `clearSchemaCache`
(per catalog, when clearing the whole catalog) and `clearCache` (global) — clearing the catalog's
`Data` + `Schema` entries and firing their callbacks so open consoles auto-reload once. The `System`
instance is **not** catalog-scoped and is therefore refreshed only through the manual button.

Each entry holds the built schema **together with the hash of the introspection it was built from**
(`CachedGraphQLSchema`) — one entry, never two parallel maps. That hash is what `refreshGraphQLSchema` compares
its fresh introspection against, i.e. against the schema the consoles are **displaying**, exactly as
`refreshCatalogSchema` compares against the in-memory version. Comparing against the *persisted* hash instead
would return "unchanged" whenever another tab of the same origin had already persisted the newer introspection
(persistence is last-writer-wins), leaving the user with the stale schema they explicitly asked to reload. No
in-memory entry, or an unknown hash, therefore rebuilds — a silent no-op is the one answer a manual reload must
never give.

The in-memory hash is read **after** the introspection returns, not before it — `refreshGraphQLSchema` is also
the revalidation a disk-served read schedules, and that revalidation starts while the hydrated schema is still
on its way into the cache. Reading up front would see an empty cache and fire every open console's callbacks on
every reload, even when the persisted copy was already current.

The raw introspection result is also persisted, so a console can be opened, browsed and used for
autocomplete while the server is unreachable — only query execution needs it. See
[persistent cache](#persistent-cache-l2).

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

### Date-time values

`OffsetDateTime` carries the instant (`Timestamp` — epoch seconds + nanoseconds, exactly as gRPC
transfers it) **and** the ISO time offset the value is expressed in. Two rules follow from that:

- **Never format the instant with a plain `Intl` formatter.** `Intl` would render it in the browser's
  time zone, so a timestamp created by a server in another zone silently shifts. `toDateTime()` puts
  the value into its own offset (`toLuxonZone()` normalizes `Z`/`±HH:MM` into a Luxon zone) and
  `getPrettyPrintableString()` formats from there, keeping the offset marker in the output
  (`8/12/26, 2:05:09 PM GMT+2`). `DateTimeRange` formats each end the same way.
- **Build values through `OffsetDateTime.of(seconds, nanos, offset)`** (or `fromDateTime()` for a
  zoned Luxon date time) rather than assembling a `Timestamp` at the call site, so the sub-second
  part is not dropped. Luxon works in milliseconds, so `toDateTime()`/`toString()` round the
  nanosecond fraction; the full value survives in `timestamp` and is what gets sent back.

Known gap: `LocalDateTime`, `LocalDate` and `LocalTime` still reinterpret their wall-clock value in
the browser zone — the server serializes them against its own default offset, and these three types
carry no offset of their own to correct with.

### Rendering raw wire data

A few views show server data the internal model has no representation for — the evitaQL console's raw
result, the traffic viewer's mutation body. Those go through `grpcMessageToJson()`
(`utils/JsonUtil.ts`), which produces the **canonical protobuf JSON** of the message.

`JSON.stringify` on a received message is always wrong: a 64-bit field without the `JS_STRING` marker is
a `bigint` and makes it **throw**, a `bytes` field turns into an object of numeric keys, every message
carries the internal `$typeName` property, and a `oneof` shows up as the `{ case, value }` pair the
generated code uses. The canonical form has none of those; fields at their default value are emitted as
well, because a raw view must not silently omit what the response contains. A timestamp comes out as an
RFC 3339 string rather than a `{ seconds, nanos }` pair.

That last part is also the one thing the canonical form cannot always do: a date-time outside the years
0001–9999 has no RFC 3339 representation and the conversion is rejected. Server-side that value would have
to come from stored data — an unbounded range end is *left unset* rather than filled with a sentinel
(`EvitaDataTypesConverter.toGrpcDateTimeRange`) — so it is out of reach in practice, and
`grpcMessageToJson()` degrades such a message to the plain bigint-safe form instead of letting one value
blank the whole view.

For objects of the *internal* model there is `serializeJsonWithBigInt()` in the same file — `toJson`
cannot be used there (no schema), and a timestamp's seconds are still a `bigint`, so anything holding a
date-time value (a price validity, a reference attribute) needs it.

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

What the viewer depends on is that invariant — *a transaction capture leads its version's block* — not the
overview specifically. Hence a page whose lead event is inside the window carries the version's
transaction twice, and the redundant capture is resolved in
[`history-viewer`](modules/history-viewer.md#the-duplicate-transaction-capture) instead of here: dropping
the overview for such versions would leave the version's only transaction capture arriving *after* its own
children (the reverse scan puts `index = 0` last), which empties the list for container-filtered views, and
it would save no round trip — `getTransactionOverview` runs once per page either way.

**Transaction records are distinguished by provenance, not by body type.** `body instanceof
TransactionMutation` is not a discriminator: a stream-delivered infrastructure capture converts to a
`TransactionMutation` exactly like the synthesised overviews do. Only this method knows which records
came from `response.changeCapture`, which is why `captureCount` is reported from here rather than
recomputed upstream. Turning one overview into its synthesised capture is plain conversion and lives in
`TransactionConverter.convertGrpcTransactionOverview`; only the merge and the provenance bookkeeping stay
in the session.

### Captures without a body

The history is always requested with `GrpcChangeCaptureContent.CHANGE_BODY`, yet a capture can still
arrive **without one**, and `ChangeCatalogCapture.body` is legitimately `undefined`. evitaDB's capture
body is a `oneof` with four cases — entity, local, entity schema and infrastructure mutation — and a
catalog-scoped schema mutation (a catalog description change, a global attribute change, …) matches none
of them, so `ChangeCaptureConverter.toGrpcChangeCatalogCapture` leaves the field unset. `HEADER` content
would do the same, which is what the option exists for.

`MutationHistoryConverter` therefore maps such a capture to a body-less record instead of treating it as
an error, and the visualisers render it from its header. Anything reading a capture body must tolerate
`undefined`.

The field stays typed as the wide `Mutation` marker. evitaDB narrows the same field to its sealed
`CatalogBoundMutation` (entity / local / schema / transaction mutation), but the corresponding TypeScript
interfaces are **empty markers**, so a union of them is structurally indistinguishable from `Mutation` and
would enforce nothing. Narrowing it for real would mean giving every mutation class a discriminant — a
separate decision, not a typing tidy-up.

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

## Persistent cache (L2)

The caches above are two-level. **L1** is the in-memory `Map` inside each cache class; **L2** is
`PersistentCacheLayer` (`database-driver/cache/`), an on-disk cache over the `storage` module's
[`LabServerDataCache`](modules/storage.md#labserverdatacache). L2 is what lets evitaLab render catalogs and
browse schemas immediately after a reload — and at all while the server is unreachable (issue #296).

`PersistentCacheLayer` is the **only** component that knows the on-disk layout, the payload encoding, and how
a stored payload becomes an internal model object. It is created by `EvitaClient` from an injected
`LabServerDataCache` and is **optional**: constructed without one (as in unit tests), the client behaves
exactly like a purely in-memory one — so "persistence off" is a first-class, testable mode.

### What is persisted: wire payloads, not the internal model

Exactly what the server sent, **before** conversion:

| Store | Key | Record |
|---|---|---|
| `catalogStatistics` | `catalogStatistics` (single record) | `GrpcCatalogStatistics[]` as protobuf binary |
| `catalogSchemas` | `<catalogName>` | `GrpcCatalogSchema` binary + `version` |
| `entitySchemas` | `<catalogName>:<entityType>` | `GrpcEntitySchema` binary + `version` |
| `graphqlIntrospections` | `<catalogName>:<instanceType>` | raw `IntrospectionQuery` JSON + xxh64 hash |

The internal model is deliberately **not** serialized: it is immutable classes with Immutable.js
collections, `bigint`s, `data-type/` wrappers and lazy accessors (`CatalogSchema.entitySchemaAccessor`).
Hand-written (de)serializers for all of that would be a second, permanently duplicated codebase, and every
model change would be a silent cache-format break.

Persisting the wire form instead means **hydration replays the payload through the very same converters a
live fetch uses** (`CatalogSchemaConverter`, `CatalogStatisticsConverter`, `buildClientSchema`), so cached and
freshly fetched data can never diverge in shape, and protobuf's wire compatibility means regenerating the gRPC
client does not invalidate the cache. The version is stored *beside* the payload so staleness can be judged
without decoding.

A hydrated `CatalogSchema` gets an `EntitySchemaAccessor` that resolves entity schemas through the ordinary
public read path (`queryCatalog` → `session.getEntitySchema`), so they come from L1, L2 or the server — the
same choice the catalog schema itself went through. It cannot re-enter a hydration in flight: a catalog schema
dereferences its accessor lazily (never during conversion) and the accessor only ever reads *entity* schemas.

### Read policy: stale-while-revalidate

Every cache read takes the cheapest available source, and a disk hit is served **immediately**:

```
1. L1 hit                       → return it
2. L1 miss → L2 hit             → put into L1, return it,
                                  AND schedule a background revalidation of that key
3. L1 & L2 miss                 → the existing accessor (network fetch + convert; the fetch point
                                  write-throughs the raw payload to L2), put into L1, return it
```

Write-through sits at the **fetch points**, where the raw protobuf message is still at hand:
`EvitaClientSession.fetchLatestCatalogSchema` / `fetchLatestEntitySchema`,
`EvitaClientManagement.fetchCatalogStatistics`, and the introspection inside `EvitaClient.getGraphQLSchema`.
Writes are fire-and-forget (`console.warn` on failure) — persistence must never delay or fail the fetch that
triggered it. Because they are fire-and-forget, **every deletion in `PersistentCacheLayer` first drains the
in-flight writes**: a write that started earlier would otherwise be free to land *after* the deletion and
resurrect the record it removed.

Revalidation re-fetches through the fetch-first `refresh*` entry points and swaps **only when the version (or
introspection hash) really differs**. It is:

- **not awaitable and not addressable** — no `revalidate()`, no `isStale(key)`. The read already returned the
  best available data; freshness arrives exclusively through the existing change callbacks, so the app keeps
  exactly one reactivity mechanism and **a reader cannot tell a revalidation apart from a CDC-driven change**;
- **once per L2 hit**, deduplicated only while in flight. There is deliberately **no per-run "already
  revalidated" set**: L1 *is* the deduplication, because a read reaches L2 only when L1 has no answer, so a
  hydrated value is read from disk again solely after its L1 copy was dropped — exactly when its freshness is
  in doubt again. A per-run set would suppress the one revalidation a `MemoryOnly` invalidation asks for, and
  the stale disk copy would be resurrected into L1 with nothing left to correct it until the page is reloaded;
- **reset on reconnect** — when the CDC stream goes `Broken → Connected`, `DataCacheRefresher` calls
  `resetRevalidationState()`, which re-runs the revalidations that *failed*: those values sit in L1, so nothing
  would ever read them from disk again and retry on its own. A *first* connect starts from `Connecting` and
  does not trigger this.

**Hydration must not overwrite what arrived while it was in flight.** Reading L2 is asynchronous (IndexedDB),
and the revalidation it schedules — or a CDC-driven change — can land *before* the hydrated value is put into
L1. Each cache therefore re-checks L1 after the disk read and keeps whatever is already there: server data is
never older than disk data, and putting the disk copy back afterwards would leave it in L1 with its
revalidation already spent, i.e. stale until the page is reloaded.

Reader components need **no changes at all** for any of this. What a component with a warm disk cache observes
when the server moved from v42 to v45:

| t | what happens | what the component sees |
|---|---|---|
| t0 | mount → `getSchema(...)` → L1 miss → L2 hit (v42), revalidation scheduled | renders v42 instantly |
| t1 | revalidation fetches v45, write-throughs L2, swaps L1, fires callbacks | its callback runs `reload()` → L1 hit (v45) → re-renders |

If the server still has v42: no swap, **no callback, no re-render** — the common case is completely silent. If
the server is unreachable: the revalidation warns, the component keeps rendering v42 and is never called.

### Invalidation: three intents, and why the enum is mandatory

Whether an invalidation also deletes the **disk** copy cannot be derived from the method, because opposing
intents share one — a catalog schema is dropped both because it provably changed and because the whole cache
is being reset. Every caller therefore states `CacheInvalidationReason` explicitly. An unstated reason would be
a silent bug that no naturally-written test catches: both variants "work", one of them just quietly destroys
the offline copy.

| Intent | Reason | Callers |
|---|---|---|
| **Change evidence** — we know the data changed or vanished | `ChangeEvidence` → L1 + L2 | CDC dispatch in `DataCacheRefresher`; evitaLab's own mutations (`renameCatalog`, `replaceCatalog`, `deleteCatalogIfExists`, collection ops, explorer services); the version-drift eviction in `session.query()` |
| **Reachability / wholesale** — nothing is known to have changed | `MemoryOnly` → L1 only | the connection panel's *Reload* action; the defensive statistics clear after a rejected CDC resume |
| **Manual refresh** — "make sure this is current" | not an invalidation at all → see below | the schema viewer's and GraphQL console's reload buttons |

`MemoryOnly` is the whole reason the enum exists: those paths fire precisely when reachability is *uncertain*,
and deleting the disk copy there would destroy exactly the data offline mode exists for. Freshness is restored
by the revalidation of the next read instead.

Two subtleties worth knowing before touching this:

- **`clearCache(reason)` is catalog-agnostic.** With `ChangeEvidence` it also discards persisted data of
  catalogs the mutation did not concern. Deliberate collateral: these operations are rare, explicitly
  user-triggered, and the server is provably reachable, so the discarded data is simply re-fetched on demand.
  The persisted side is purged **wholesale by store** (`PersistentCacheLayer.deleteAllSchemas`, mirroring the
  GraphQL delegate's `deleteAllSchemas`) — *not* by walking the in-memory caches, which only know the catalogs
  read in this session. A catalog mutated right after a reload has nothing in memory, and its pre-mutation
  records would otherwise survive on disk and be served first by the next read.
- **`renameCatalog` / `replaceCatalog` / `deleteCatalogIfExists` bypass the cache classes entirely** — they
  drop the whole per-catalog `EvitaSchemaCache` object rather than invalidating through it, so no reason enum
  can fire for them. They go through `discardCatalogCaches`, which additionally (a) deletes the catalog's disk
  records (catalog schema, entity schemas by key prefix, GraphQL introspections) and (b) **evicts the shared
  session**, which captured the cache object at construction and would otherwise keep answering from the very
  cache being discarded.

### Freshness signal

Serving data from disk is invisible by design — which means the user has to be told when what they see could
not be checked. `EvitaClient` exposes two reactive values for that, and nothing else:

```ts
evitaClient.dataFreshness            // Ref<DataFreshness>  — Live | Cached
evitaClient.unverifiedCachedRecordCount   // Ref<number>    — feeds the badge's tooltip
```

`DataFreshness.Cached` means **"at least one value restored from disk could not be verified against the
server"**. It is deliberately *not* entered for the moment between a disk hit and its successful revalidation:
that would flash the badge on every healthy startup and teach users to ignore it. So the signal answers "is
what you see confirmed?", not "did this come from disk?".

It is a **whole-client** signal. There is no `isStale(key)` and no per-record staleness, for the same reason
readers cannot tell a cached read from a live one — see
[the caller's point of view](#read-policy-stale-while-revalidate). The consumers are the status bar
(`CachedDataIndicator.vue`) and the connection explorer's panel header.

`CachedDataIndicator` and `ChangeStreamIndicator` answer different questions and may legitimately disagree:
the latter reports whether the **live update channel** works, the former whether **what you are looking at** is
confirmed. An unreachable server with nothing cached shows a broken stream and `Live` data.

A failed revalidation is remembered together with *how* to retry it, and four things re-trigger it:

1. **the server becoming reachable again** — the primary path. `PersistentCacheLayer` watches the
   [offline state](#offline-state--is-evitalab-offline) and re-verifies everything unverified the moment it
   flips back. Watched with `flush: 'sync'` on purpose: with default scheduling a recovery happening in the same
   tick as the failure before it collapses into no net change and the callback never runs;
2. **a bounded retry** — a server that has just restarted can answer while still refusing catalog work, so a
   single attempt is not enough. A failed re-verification retries every 3 s, up to 5 times, while the server
   stays reachable (budget reset on each new reachability). Measured: without it, recovery was *flaky* — the
   badge cleared within seconds on some restarts and stuck indefinitely on others;
3. `clearCache()` — the explicit **Reload** must not be a visible no-op against a stale-data badge, and the
   reads it triggers are answered from disk, so it re-verifies explicitly;
4. the CDC stream transitioning `Broken → Connected`, which also means changes may have been missed.

Path 1 replaced the CDC transition as the primary trigger because that one is subject to the stream's reconnect
backoff (5 s → 10 s → 20 s → 60 s): measured against a real server restart, the offline state cleared in ~15 s
while the badge waited ~75 s for the stream. It now clears within a few seconds of the server answering.

`resetRevalidationState()` never clears the unverified set itself: claiming verification before a revalidation
has returned would be a lie. Each entry is removed only by its own success. It fires one refresh per unverified
key concurrently, so a reconnect after a long outage is a small burst rather than one request — bounded by how
much was actually restored from disk.

**Deleting a record forgets that it was unverified.** A record no longer on disk cannot be served and will never
be verified either, so leaving its key in the unverified set would keep the badge lit forever, counting
something that does not exist. Every deletion path in `PersistentCacheLayer` therefore drops the matching
key(s) — by prefix for the wholesale ones — *and* tombstones any revalidation of them still in flight, whose
failure would otherwise re-add the key it was deleted from.

### Eviction and the user-facing purge

Records carry `storedAt`, and every write-through enforces a per-store record cap
(`recordLimits` in `PersistentCacheLayer`), evicting the least-recently-**written** records beyond it. Without
a cap, records of catalogs and collections evitaLab never sees again — dropped while it was closed, renamed by
somebody else — would accumulate forever. A wrongly evicted record costs one refetch, nothing more.

The cap is enforced by `LabServerDataCache.enforceRecordLimit`, deliberately **not** by the layer: the layer's
deletion helpers drain in-flight writes (`awaitPendingWrites`), and eviction runs *inside* a tracked write, so
routing it through the layer would let a write wait on itself. Keeping it on the storage facade — which knows
nothing about pending writes — makes that deadlock structurally impossible.

`EvitaClient.clearPersistentCache()` discards everything persisted for the connection and drops the in-memory
copies with it, so the next read goes to the server. It backs the connection explorer's **Clear local cache**
action; no data path depends on it, evitaLab simply starts cold next time. It **returns** whether evitaLab can
persist anything at all, so the caller can report "nothing to clear" rather than claim success.

`EvitaClient.persistentCacheAvailable` is the reactive form of the same question — `false` when the browser
refuses storage. The cache layer itself is **not** optional: a client always has one, because storage that does
not work is reported by the storage facade rather than by the layer's absence. It is badged by the status bar and
is **not** derived from whether IndexedDB *exists*: the
storage facade owns that classification, because a refused open, a lost connection and a full disk mean different
things — see [`storage` — when storage is unusable](modules/storage.md#when-storage-is-unusable).

### What is deliberately *not* persisted: server metadata

`EvitaServerMetadataCache` (server status, configuration, engine settings) has **no** persistent delegate, and
that is a decision, not an omission:

- **Server status is a liveness signal, not data.** `ConnectionExplorerPanel` sets `serverStatus = undefined`
  when the fetch fails, and `ConnectionExplorerPanelMenuFactory` derives `serverReady` / `serverWritable` from
  exactly that. A *persisted* status would make evitaLab believe a dead server is up and re-enable mutating
  actions against it — it would break the reachability gating the whole offline story rests on.
- **Engine settings** are safer (they are constant for a server process) but feed the
  [conflict-resolution derivation](#transaction-conflict-resolution); a value that went stale across a server
  restart plus reconfiguration would mis-render silently, with no signal to the user.

A "last known server state" display for the server viewer would be safe **provided it never routes through
`EvitaServerMetadataCache`**, so nothing can mistake it for a reachability signal. That is separate work.

### Manual refresh: fetch first, never clear

A UI reload button must not route through the invalidation funnels. Offline, clearing L1+L2 before an
impossible refetch would destroy the offline copy (*a user action that cannot succeed must not eat the data it
targets*), while clearing L1 and serving L2 back would fake a successful refresh. The driver therefore exposes
fetch-first entry points:

| API | Backs |
|---|---|
| `refreshCatalogSchema(catalogName)` | schema viewer reload (`SchemaViewerService.refreshSchema`) |
| `refreshEntitySchema(catalogName, entityType)` | ditto, entity-level |
| `refreshGraphQLSchema(catalogName, instanceType)` | GraphQL console's *Reload GraphQL schema* |
| `EvitaClientManagement.refreshCatalogStatistics()` | background revalidation of the catalog listing |

All follow **fetch → compare → swap → notify**: fetch fresh *first*; on success overwrite L1 + L2 and fire the
callbacks **only when the version/hash actually differs** (identical data = verified current: no swap, no
callbacks, no re-render churn); on failure keep everything and let the error propagate to the caller's toaster.

The comparison is a version for schemas and an **identity string** for the catalog listing
(`EvitaCatalogStatisticsCache.identity`): name, header version, state, `unusable` and the collection names of
every catalog. Anything the explorer *decides* on belongs in it — `unusable` alone determines whether a catalog
can be opened at all, so leaving it out would suppress the swap **and** the callbacks and keep rendering a
catalog as unopenable. Values that are merely displayed (record counts, size on disk) stay out, so they cannot
cause re-render churn.
Nothing is ever cleared, so there is no empty-cache window either. Background revalidation and manual refresh
share this one code path — they differ only in trigger and in error handling (`console.warn` + release the key
vs. throw to the caller). They return `boolean`: whether anything was actually swapped.

To bypass the caches and read straight from the server, use `session.fetchLatestCatalogSchema()` /
`fetchLatestEntitySchema(entityType)` — these are what the refresh paths are built on (and the write-through
points). Ordinary reads must keep using `session.getCatalogSchema()` / `getEntitySchema()`.

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

`EvitaClient.clearCache(reason)` clears **all** client caches — catalog statistics, sessions, schemas
(internal and GraphQL) and the server metadata cache too; `reason` decides the fate of the persisted copies
(see [invalidation intents](#invalidation-three-intents-and-why-the-enum-is-mandatory)). It clears the
**server metadata cache first**, so the
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
  `clearCatalogStatisticsCache(MemoryOnly)` — only *missed* changes are known, not actual ones, so the
  persisted listing stays and the revalidation of the next read verifies it;
- on a `Broken → Connected` transition (a genuine reconnect, not the first connect) it calls
  `persistentCacheLayer.resetRevalidationState()`, so every persisted value is verified once more — data may
  well have changed while evitaLab could not observe it.

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

Every invalidation in this table passes `CacheInvalidationReason.ChangeEvidence` — a pushed mutation is the
strongest evidence there is — so it drops the persisted copies along with the in-memory ones.

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

evitaLab keeps **no client-side registry of server tasks**: methods returning a `TaskStatus` (catalog
backup, for instance) hand it straight to the caller and nothing else is notified. A task tracker was
considered and dropped — the CDC stream already keeps the affected views current, so a second
tracking mechanism would only duplicate it.

## Downloading server files

`EvitaClientManagement` exposes two entry points for the files the server offers for download
(backups, JFR recordings, traffic exports):

```ts
async *fetchFileStream(fileId: Uuid, options?: FetchFileOptions): AsyncIterable<ServerFileChunk>
async  fetchFile(fileId: Uuid, options?: FetchFileOptions): Promise<Blob>
```

`FetchFileOptions` carries an optional `signal` and an optional
`onProgress(bytesRead, totalSizeInBytes)`. Every `GrpcFetchFileResponse` repeats
`totalSizeInBytes`, so progress is known from the first chunk on (it is `0n` if the server does not
report a size — guard before dividing). `onProgress` is called **once per chunk**, i.e. tens of
thousands of times for a multi-gigabyte file: throttle any reactive state updates in the consumer, the
driver deliberately does not.

`fetchFile` is `fetchFileStream` collected into a `Blob` and therefore buffers the whole file in
memory — prefer the stream for anything that can be large (`VDownloadServerFileButton` writes chunks
straight to disk where the browser allows it, see [`viewer-support`](modules/viewer-support.md)).

**Cancellation contract:** aborting `options.signal` cancels the gRPC stream, and the iteration
rejects with a `ConnectError` carrying `Code.Canceled` — `ErrorTransformer` passes `ConnectError`s
through unchanged, so a caller can distinguish a user-requested cancellation from a transfer failure by
testing `e instanceof ConnectError && e.code === Code.Canceled`.

## Error handling

Every driver call wraps errors through `ErrorTransformer.transformError(e)`, converting transport
errors into evitaLab error types derived from `LabError` (`modules/base/exception/`). Callers
(services/components) therefore catch evitaLab errors, not gRPC errors — display them via
`useToaster().error(title, error)` (see [guidelines](guidelines.md#error-handling)).

`ConnectError` is mapped by `Code`, and **only for the two codes whose raw message would otherwise reach the
user verbatim** — everything that renders a driver error (the toaster, `TabLoadingScreen`) renders `message` as
it is, and `[deadline_exceeded] the operation timed out` is not an answer:

| `Code` | Becomes |
|---|---|
| `DeadlineExceeded` | `TimeoutError` — *"Request timed out. Please check your settings of connection '…'"* |
| `Unavailable` | `EvitaDBInstanceNetworkError` |

Every other code is passed through **unchanged**, and three contracts depend on that: `Code.Unauthenticated`
(the server-dropped-session retry in `executeInSharedSession`), `Code.InvalidArgument` (the already-closed
swallow in `session.close()`, plus the traffic/mutation history's specific error states) and `Code.Canceled`
(the documented `fetchFileStream` cancellation contract). All three are matched by callers *after* the
transformation, so do not start mapping those to `LabError` types. Pinned by
`test/modules/database-driver/errorTransformer.test.ts`.

### Telling "unreachable" apart from "failed"

`exception/connectivityError.ts` exposes `isConnectivityError(e)` — whether an error means *the server could not
be reached*, as opposed to the server rejecting or failing the request. It backs the notification layer's
collapsing of outage floods
([`notification`](modules/notification.md#reporting-outages-once-not-per-failure)).

The predicate has to be shape-based rather than code-based, and **two** shapes matter — both verified against a
real server being stopped:

| Path | Shape reaching the predicate |
|---|---|
| gRPC | `ConnectError`, `code = Code.Unknown` (2) — *not* `Code.Unavailable` — `rawMessage = 'Failed to fetch'` (also seen: `'network error'`) |
| HTTP / GraphQL (ky) | a **raw `TypeError`** with message `Failed to fetch`, because classification runs before `ErrorTransformer` converts it |

Since a genuine server-side fault also lands in `Code.Unknown`, that code counts as connectivity *only* when the
message is a known browser network failure — otherwise real problems would be silently swallowed. Missing the
bare `TypeError` meant a stopped server went unnoticed on every non-gRPC call, so both shapes are covered and
pinned by tests.

### Offline state — "is evitaLab offline?"

`model/serverConnectivity.ts` holds whether the server is currently reachable, plus a
`currentOutageReportingRound()` counter. The notification layer uses it to report an outage
[once per round](modules/notification.md#reporting-outages-once-not-per-failure).

Both transitions are observed at real funnels, so it is a measured state rather than an inference:

| Transition | Observed at |
|---|---|
| → unreachable | `ErrorTransformer` classifying a raw failure as connectivity (every driver failure passes through it), and the gRPC transport interceptor |
| → reachable | the gRPC transport interceptor seeing **any** successful response, and the `afterResponse` hook of `AbstractEvitaClient.httpApiClient` seeing **any** HTTP response |

`serverUnreachableState()` exposes it reactively (also as `EvitaClient.serverUnreachable`) so the UI can badge
it — the connection explorer's panel header does. Keep it distinct from
[data freshness](#freshness-signal): *offline* is about the **server**, *cached* is about whether the **data on
screen** was verified. They answer different questions and can differ, which is why they are badged in different
places.

Recovery is observed on **both transports**, and both are needed:

- the interceptor in `AbstractEvitaClient.transport` covers all four gRPC service clients, unary and streaming;
- the `afterResponse` hook on the shared ky instance covers every HTTP call (GraphQL, JFR observability). Any
  response counts, 4xx/5xx included — the server answered, which is the whole question; ky runs the hook before
  it throws `HTTPError`. Without it, a session spent entirely in a GraphQL console produced no gRPC traffic at
  all, so one transient fetch failure latched evitaLab offline — badge lit, every title-only error toast
  swallowed — until some unrelated gRPC call happened to succeed.

**Every HTTP call to the evitaDB server must therefore go through `httpApiClient`** (exposed to
`EvitaClientManagement` as `EvitaClient.httpClient`), never raw `ky`: raw calls bypass both this hook and the
client's [default deadline](#deadlines--cancellation), and ky's own 10 s default is itself a latch trigger via
`TimeoutError`.
`DemoSnippetResolver` is the one legitimate raw `ky` user — it does not talk to the evitaDB server.

Recovery is otherwise self-correcting without polling: the CDC stream retries on its own backoff and the
connection explorer re-checks the server status every few seconds, so whichever gets through first clears the
state — which also re-triggers the pending revalidations watched by `PersistentCacheLayer`.

Deliberately **not** derived from the change-stream status: a server with CDC disabled leaves that stream
permanently broken while being perfectly reachable.

A round counter rather than a timestamp because the consumer's question is "have I already reported *this*
outage?", which no time window can express: too short and a sustained outage drips notifications forever as
pollers retry, too long and a deliberate user action goes unanswered.

The round advances on every new outage **and** on every `requestOutageReport()`. That second entry point is
called only by the user-initiated refresh paths — the connection explorer's *Reload*, and the schema viewer's and
GraphQL console's reload buttons (in their **service** methods, which background revalidation does not go
through: it calls `EvitaClient.refresh*` directly). It is what keeps a deliberate user action answered while the
pollers behind the same outage stay silent.

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
