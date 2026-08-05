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
- **Catalog loading is gated on server reachability**: when the server status reports the server is
  unreachable, the panel skips the catalog fetch entirely. Clicking **Reload** against a down server
  therefore shows a single server-status error rather than one failure per cleared cache.

The panel does not poll for server status on its own — [`server-viewer`](server-viewer.md)'s poll fires
the server-status callbacks that keep this panel's menu in sync.

## Related

- [`workspace`](workspace.md) — the panel slot and `WorkspaceService.createTab`
- [`base`](base.md) — `MenuFactory`, `VTreeViewItem`
- [`server-viewer`](server-viewer.md) — the shared server-status signal
- [design language](../design-language.md#navigation-opens-tabs)
