# `storage` — persistent client-side storage

Generic module, registered second (right after [`config`](config.md)).

- **Provides:** `labStorageInjectionKey` → `LabStorage` (`storage/LabStorage.ts`),
  `labServerDataCacheInjectionKey` → `LabServerDataCache` (`storage/LabServerDataCache.ts`)
- **Injects:** `evitaLabConfigInjectionKey`

Two stores with different jobs — pick by **who owns the data**:

| | `LabStorage` | `LabServerDataCache` |
|---|---|---|
| Backing | local storage (`store2`) | IndexedDB (`idb`) |
| API | synchronous | asynchronous |
| Values | JSON | structured, incl. `Uint8Array` |
| Quota | ~5 MB | large (browser-managed) |
| Holds | data evitaLab **owns** (connections, settings, open tabs) | a **copy** of data the server owns |
| Losing it | loses user state | costs one refetch |

**Why one is a "Storage" and the other a "Cache"** — the last row. Both are equally *persistent* in the browser
sense, so neither name says so; the distinction is durability of **intent**. Everything about
`LabServerDataCache` assumes its contents are re-fetchable: records are evicted by age once a store is over its
cap, a format-version bump abandons every record, and a failed write is dropped without an exception. Putting
anything the user would miss in there would lose it silently to any of those three. That is the rule to remember:
**if it cannot simply be fetched again, it belongs in `LabStorage`.**

The IndexedDB database name prefix (`evitaLab-cache:`) is deliberately **not** tied to the class name. Renaming
it would orphan every database already on users' disks — and the format-version sweep could not collect them,
because it matches on that very prefix. Treat the prefix as a storage format constant, not as a name.

## `LabStorage`

A thin key-value wrapper around browser local storage (the `store2` library). Consumers ask it for a
namespaced sub-store rather than touching local storage directly.

`get(key, def)` falls back to `def` only when the key is missing — falsy values (`0`, `''`, `false`)
are returned as they were stored.

**Storage keys must be globally unique.** There is no per-module key prefixing enforced by the type
system, so two modules picking the same key silently share (and corrupt) each other's state. Pick a
key that names the module and the concern.

It injects [`config`](config.md) because what gets persisted depends on the run mode — a driver-mode
instance and a standalone instance do not share the same persistence expectations.

Main consumers: `workspace` (`openedTabs`, `selectedTab`, `tabHistory`), `connection-explorer`
(`connectionExplorerPanelWidth` — see [panel width](connection-explorer.md#panel-width)) and `welcome-screen`
(`welcomeScreenStore`).

## `LabServerDataCache`

An async key-value store over IndexedDB, used to keep server data (catalog statistics, catalog/entity
schemas, GraphQL introspections) across reloads so evitaLab can start from disk — and stay usable while the
server is unreachable. Its **only** consumer is the `database-driver`'s `PersistentCacheLayer`, which owns
the record layout and payload encoding; see
[database driver — persistent cache](../database-driver.md#persistent-cache-l2).

```ts
await cache.put(ServerDataCacheStore.CatalogSchemas, catalogName, record)
const record = await cache.get<SchemaRecord>(ServerDataCacheStore.CatalogSchemas, catalogName)
await cache.deleteByPrefix(ServerDataCacheStore.EntitySchemas, `${catalogName}:`)
```

Records live in one object store per kind (`ServerDataCacheStore`). The cache itself knows nothing about
evitaDB types — it stores and returns records exactly as given.

**No operation ever throws.** A cache is an optimization, so a failing (or entirely absent) IndexedDB must
never break a data path: reads degrade to a miss and writes are dropped. Callers therefore read `undefined` as
"not cached" and never have to distinguish it from "storage broken".

### When storage is unusable

Storage can be missing or refused for reasons evitaLab cannot influence:

| Case | How it shows up |
|---|---|
| Hardened / policy-restricted profile, privacy extension, "block all site data" | `indexedDB` absent, or `open()` throws `SecurityError` |
| Third-party (cross-origin iframe) context with site data blocked | `SecurityError` |
| Opaque `file://` origin — a `dist/` opened directly instead of served | rejected open |
| Profile corruption, unsupported filesystem | Firefox `UnknownError` |
| Disk full / quota exceeded | `QuotaExceededError` on a **write** — storage itself is fine |
| Browser reclaims storage, user clears site data, database deleted elsewhere | the open connection dies: `InvalidStateError` / `NotFoundError`, or `idb`'s `terminated` |
| Private browsing (modern) | works, but is in-memory and dies with the session |
| Safari's 7-day eviction of script-writable storage | data silently gone; the next read is a miss |

Those are **not** equivalent, so they are classified rather than lumped together — turning the cache off for a
single oversized record would be worse than keeping it:

| Class | Reaction |
|---|---|
| **fatal** — the database cannot be opened at all | `usable` flips to `false` and every subsequent operation short-circuits *before* touching IndexedDB. Reported once |
| **connection lost** — a working connection was closed underneath us | the handle is dropped and reopened **once**; only a failing reopen is fatal, because a browser that closed a connection under pressure usually accepts a fresh one |
| **transient** — quota exceeded, transaction aborted | that one operation is dropped, the cache keeps working. Warned once per store until an operation on it succeeds again, so a persistently full disk cannot turn every write into console noise |

`usable` is a `Readonly<Ref<boolean>>`, surfaced as `EvitaClient.persistentCacheAvailable` and badged by the
status bar's [`PersistentCacheIndicator`](workspace.md#status-bar-indicators). It starts optimistic: a missing
`indexedDB` is detected synchronously in the constructor (so the badge is right from the first paint), but a
*refused* open is only discovered when something is first read or written.

Two deliberate exceptions to the short-circuit: `clearStore` and `clear` are attempted even when storage has been
declared unusable, because they back the explicit *Clear local cache* action and storage that worked earlier may
still hold records the user is asking to be rid of. `clearPersistentCache()` returns `usable`, so the connection
explorer reports "nothing to clear" instead of claiming success.

`deleteByPrefix` exists because per-catalog records are not enumerable any other way — entity-schema keys are
`<catalogName>:<entityType>`, and the colon separator is what keeps `shop:` from matching `shopArchive:…`
(evitaDB classifiers cannot contain a colon).

`enforceRecordLimit(store, maxRecords)` evicts the least-recently-**written** records of a store, by each
record's `storedAt`. The record count is checked first and is cheap, so it is safe to call after every write —
which the driver does. Two properties of the implementation are load-bearing:

- every store carries a **`storedAt` index**, walked by a *key cursor* (index key + primary key only). A store
  sitting at its cap runs eviction on every single write, and materializing all payloads to read a timestamp
  would mean loading up to 20 whole introspection results per write;
- the count, the cursor walk and the deletes run in **one read-write transaction**, so a write landing mid-pass
  cannot shift which record is evicted.

A record **without** `storedAt` is absent from the index and therefore never sorts "as the oldest" — every
writer stamps one, and abandoned formats are never read, so none can exist; a surplus that the index cannot
cover is deleted by key as a can't-happen safety net, purely to keep the cap honest.

**The limit deliberately lives here rather than in the driver's cache layer**: that layer
drains in-flight writes before every deletion, and eviction runs *inside* a tracked write, so routing it through
the layer would let a write wait on itself. This facade knows nothing about pending writes, which makes that
deadlock impossible by construction.

`navigator.storage.persist()` is deliberately **not** requested. Some browsers answer it with a permission
prompt, and an unsolicited storage prompt at startup is a poor trade for a cache that is disposable by design:
everything in it can be re-fetched, and eviction by the browser costs one cold start.

### Database naming and format versions

`evitaLab-cache:<xxh64(providerName)>:<cacheFormatVersion>` — namespaced per server/connection exactly like
`LabStorage`, plus a **record format version**. On startup the cache deletes every `evitaLab-cache:*` database of
a *different* format version, so an abandoned format never lingers on the user's disk. That happens two ways,
because `indexedDB.databases()` is not implemented everywhere (notably **not in Firefox**):

1. this connection's **own** older format versions are deleted **by name** — the name is fully determined by
   `providerName` and the version, so no enumeration is needed and this works in every browser;
2. `indexedDB.databases()`, where available, additionally catches the databases of *other* connections.

Without step 1 a `cacheFormatVersion` bump would leave a Firefox user's abandoned database on disk permanently.
Where step 2 is missing, other connections' abandoned databases are merely unused, never read.

Keeping the format version in the database **name** rather than in its IndexedDB version is also what makes an
`openDB` *blocked* event unreachable: no tab ever requests a different version of the same database, so an open
cannot wait on another tab's connection. A `blocked` handler is registered anyway, because the alternative
failure mode is an open that never settles — which would hang a read rather than degrade it.

Bump `cacheFormatVersion` only on a breaking change to the record layout — which includes the **store layout**,
such as adding an index. **Regenerating the gRPC client does not require a bump** — payloads are stored as
protobuf binary, which is forward/backward compatible. A change in what a converter *means* by a field might.

The current version is **2**; version 1 predates the `storedAt` index used by eviction. Note that bumping this
version rather than the IndexedDB one is what keeps `blocked` unreachable (see above) — a database of a
different format is a different *name*, not a different version of the same database.

### Security & multi-tab

IndexedDB is same-origin isolated: only pages from the exact origin (scheme + host + port) that created the
database can read or even enumerate it, and third-party iframe storage is additionally partitioned by
top-level site. The threat surface is therefore **identical to the existing local storage data**: XSS on the
evitaLab origin, other apps co-hosted on the *same* origin (the `evitaLab-cache:` prefix is a naming
convention, not an access boundary), and OS-level access to the unencrypted browser profile. What is
persisted is domain *structure* — schemas and statistics; no tokens, no credentials, no entity data.

Same-origin tabs share one database. Every write is an idempotent whole-record `put` keyed by name, so
concurrent writers resolve to last-writer-wins, which is safe. Desktop driver instances are separated by the
`providerName` namespace, again as with `LabStorage`.

## Related

- [architecture](../architecture.md)
- [`workspace`](workspace.md) — the biggest consumer
