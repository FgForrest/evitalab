# `connection-explorer` — the left panel tree

Feature module. The left panel tree of catalogs and collections of the connected server, including
catalog/collection management actions (create, rename, drop, …). It is a **panel**, not a tab, but it is
the launch point for most tabs — which is why it injects nearly every tab factory in the app.

- **Provides:** `connectionExplorerServiceInjectionKey`, `catalogItemServiceInjectionKey`,
  `collectionItemServiceInjectionKey`, `catalogItemMenuFactoryInjectionKey`,
  `collectionItemMenuFactoryInjectionKey`, `connectionExplorerPanelMenuFactoryInjectionKey`
- **Injects:** `evitaClientInjectionKey`, `workspaceServiceInjectionKey`, `toasterInjectionKey`,
  and the tab factories for entity-viewer, evitaql-console, graphql-console, schema-viewer,
  server-viewer, task-viewer, backup-viewer, jfr-viewer, traffic-recordings, traffic-record-history and
  mutation-history

## Layout

| Path | What's in it |
|------|--------------|
| `component/ConnectionExplorerPanel.vue` | The panel itself |
| `component/CatalogItem.vue`, `CollectionItem.vue` | Tree items |
| `component/*Dialog.vue` | Management dialogs — create/rename/duplicate/replace/delete catalog, create/rename/delete collection, activate/deactivate, make immutable/mutable, switch to alive state |
| `model/` | `CatalogMenuItemType`, `CollectionMenuItemType`, `ConnectionMenuItemType`, `MutationProgressType` |
| `service/*MenuFactory.ts` | Three `MenuFactory` subclasses (connection panel, catalog item, collection item) that build the ⋮ menus |
| `service/CatalogItemService.ts`, `CollectionItemService.ts`, `ConnectionExplorerService.ts` | The actions behind the menus |

## Menus are built by factories

The three `*MenuFactory` services (extending [`base`](base.md)'s `MenuFactory`) decide which items
exist and whether each is enabled. Enablement is composed from predicates such as
"is the server writable" and "is the catalog usable", so an item can be present-but-disabled rather than
missing. Catalog actions are gated on catalog state — most are disabled while a catalog is
`WARMING_UP`.

## Behaviour when the server is unreachable

Two behaviours worth knowing before changing this panel:

- When the server is unreachable **at load**, the panel disables its server-related menu actions and
  runs a silent **5 s retry loop** that recovers on its own — repopulating status + catalogs and
  re-enabling the actions once the server responds again. No manual **Reload** or page refresh is
  needed.
- **Catalog loading is always attempted, even when the server status failed.** The driver may serve the
  catalog listing from its
  [persistent cache](../database-driver.md#persistent-cache-l2), and that is what makes the panel — and
  with it every catalog-scoped tab — usable while the server is down. The listing is therefore fetched
  regardless of reachability; only the *error reporting* stays gated: when the fetch fails **and** the
  server is known to be unreachable, nothing is toasted, because the server-status error already told the
  user. Clicking **Reload** against a down server thus still shows a single error, not one per cache.

- The panel header shows a **`mdi-cloud-off-outline` badge while evitaLab is offline** — i.e. while the driver
  reports the server unreachable (see
  [database driver — offline state](../database-driver.md#offline-state--is-evitalab-offline)). The outage
  belongs to the connection, which is why it is badged here.

  It is deliberately **not** the status bar's cached-data badge: that one reports whether the *data on screen*
  has been verified, a different question. Showing both in the header was redundant — the header answers "is the
  server there?", the status bar "is what I'm looking at current?".

The panel does not poll for server status on its own — [`server-viewer`](server-viewer.md)'s poll fires
the server-status callbacks that keep this panel's menu in sync.

## Cache actions

Two entries under the menu's **Manage** subheader, easy to confuse:

| Action | Effect |
|---|---|
| **Reload** | `clearCache(MemoryOnly)` — drops the in-memory caches and re-reads. **Keeps** the on-disk copy, because this fires exactly when reachability is uncertain and it is what evitaLab serves while the server is down. |
| **Clear local cache** | `clearPersistentCache()` — discards everything evitaLab persisted for this connection *and* the in-memory copies, so the next read goes to the server. |

Clearing the local cache needs no confirmation: nothing on the server is touched and the data returns on the
next read. It reports through the toaster either way.

**Clear local cache stays enabled even when the browser refuses storage**, and reports "nothing to clear"
instead. It is deliberately not greyed out: `clearPersistentCache()` returns whether evitaLab can persist
anything at all, and answering an explicit user action with an honest message beats a disabled item whose reason
the user has to guess. The condition itself is badged once, by the status bar's
[`PersistentCacheIndicator`](workspace.md#status-bar-indicators) — this panel does not repeat it.

## Long-running catalog operations and their progress flags

`CatalogItemService.*WithProgress` (activate, deactivate, duplicate, rename, replace, make mutable/immutable,
go alive) consume a progress stream and mirror it onto the `CatalogStatistics` object as a
`MutationProgressType` entry, which `CatalogItem.vue` renders as a flag (*Activating - 42%*).

**Every one of them removes the entry in a `finally`.** `setProgress` drops it by itself only at exactly 100 %,
and a stream may well stop reporting below that or end because the operation failed — while the progresses map
lives in memory only, so a flag that outlives its operation is not persisted, not part of the listing's
[identity](../database-driver.md#manual-refresh-fetch-first-never-clear), and therefore cleared by nothing short
of a page reload. The stream ending is the signal that the operation is over, whatever its last reported value.

## Related

- [`workspace`](workspace.md) — the panel slot and `WorkspaceService.createTab`
- [`base`](base.md) — `MenuFactory`, `VTreeViewItem`
- [`server-viewer`](server-viewer.md) — the shared server-status signal
- [design language](../design-language.md#navigation-opens-tabs)
