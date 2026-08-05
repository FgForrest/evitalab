# `database-driver` — all communication with evitaDB

Generic module, registered fourth. By far the largest module (~420 files) and the **only** place that
talks to an evitaDB server. Everything else goes through `EvitaClient`, normally from a service.

> **This module has a dedicated deep-dive: [database driver](../database-driver.md).**
> That document is the reference for sessions, the internal model, caching, CDC and error handling.
> This page is orientation only — prefer extending the deep-dive over duplicating it here.

- **Provides:** `evitaClientInjectionKey` → `EvitaClient` (`useEvitaClient()`),
  `dataCacheRefresherInjectionKey` → `DataCacheRefresher`
- **Injects:** `connectionServiceInjectionKey`, `evitaLabConfigInjectionKey`

## Top-level layout

| Path | What's in it |
|------|--------------|
| `EvitaClient.ts` | Entry point — `queryCatalog()`, `updateCatalog()`, `queryCatalogUsingGraphQL()`, catalog names, `.management` |
| `EvitaClientSession.ts` | Session-scoped operations: queries, schema access, collection management, backups, traffic recording, mutation history, labels |
| `EvitaClientManagement.ts` | Server-level operations: status, configuration, catalog statistics, backup/restore, file listing/download, task monitoring |
| `AbstractEvitaClient.ts` | Shared gRPC client plumbing the three above build on |
| `DataCacheRefresher.ts` | One system-CDC stream that keeps the client caches in sync |
| `EvitaSchemaCache.ts`, `GraphQLSchemaCache.ts`, `EvitaCatalogStatisticsCache.ts`, `EvitaServerMetadataCache.ts` | The four caches, with their invalidate-vs-refresh semantics |
| `connector/grpc/` | gRPC transport — `gen/` (generated from proto), `service/converter/` (gRPC ⇄ internal model), `model/`, `utils/` |
| `connector/gql/` | GraphQL transport |
| `data-type/` | evitaDB scalar types — `Uuid`, `OffsetDateTime`, `Scalar`, … |
| `request-response/` | The internal model (see below) |
| `exception/` | `ErrorTransformer` and driver error types |
| `model/` | Cross-cutting driver models |

## The internal model (`request-response/`)

Grouped by domain: `schema/` (+ `schema/mutation/`), `data/` (+ `data/mutation/`), `cdc/`, `task/`,
`traffic-recording/`, `server-file/`, `status/`, `transaction/`, `jfr/`, `utils/`.

Never expose generated gRPC types outside this module — converters in
`connector/grpc/service/converter/` map them into these classes, which are immutable where possible.

Conflict-resolution parts of a schema (`ConflictPolicy`, `GranularConflictPolicy`, `ConflictResolution`,
`ConflictResolutionOverride` under `request-response/schema/`, mapped by `ConflictResolutionConverter`) and
the server-reported `EngineSettings` (`request-response/status/`, mapped by `EngineSettingsConverter`) that
carries the engine-wide default are described in the deep-dive:
[transaction conflict resolution](../database-driver.md#transaction-conflict-resolution).

## Two rules that bite

- **Errors** — every driver call wraps failures through `ErrorTransformer.transformError(e)`, so
  callers catch `LabError` subclasses, never gRPC errors. The one exception is `ConnectError`, which is
  returned as-is — that is what lets a caller recognize a cancelled stream
  (`Code.Canceled`, see [downloading server files](../database-driver.md#downloading-server-files)).
- **Model-class i18n** — model getters (e.g. `representativeFlags`) must use `i18n.global.t`, never
  `useI18n()`, which throws outside component setup.

## Regenerating gRPC types

Generated code under `connector/grpc/gen/` comes from evitaDB's `.proto` files — use the
`generate-evitadb-client` skill rather than editing it.

## Related

- [database driver](../database-driver.md) — **the** reference for this module
- [`connection`](connection.md) — supplies the server URL
- [guidelines — error handling](../guidelines.md#error-handling)
