# Module catalog

evitaLab's codebase is split into **modules** under `src/modules/`. A module is a semantic domain
separation (a directory), not a JS module. Modules communicate through dependency injection
(see [architecture](../architecture.md#module-registration-and-dependency-injection)).

Modules that provide injectable services implement `ModuleRegistrar` (`src/ModuleRegistrar.ts`) and
are registered in `src/modules/modules.ts`. **Registration order matters** — base generic modules are
registered before the UI feature modules that inject their services.

Typical inner structure of a module:

```
<module>/
├── <Module>ModuleRegistrar.ts   # optional, only when the module provides/injects DI services
├── component/                   # Vue components of the module
├── model/                       # domain model classes (immutable where possible)
├── service/                     # injectable services (business logic)
└── workspace/                   # tab integration (TabDefinition, TabParams, TabData, factory)
    ├── model/
    └── service/
```

## Abstract modules

Provide common abstract services, models and UI components for other modules. They have no UI feature
of their own.

| Module | Purpose | Key contents |
|--------|---------|--------------|
| `base` | Foundation for everything else | Custom `V*` UI components (`component/`, see [UI components](../ui-components.md)), base error types (`exception/LabError.ts`, `UnexpectedError.ts`, `InitializationError.ts`), shared models (dialogs, menus, properties table, tree view) |
| `code-editor` | CodeMirror 6 editor wrappers | `VQueryEditor.vue`, `VInlineQueryEditor.vue`, `VPreviewEditor.vue`, `VPreviewEditorDialog.vue`, status-bar integration extension (`extension/workspaceStatusBarIntegration.ts`) |
| `console` | Shared infrastructure for query consoles | `result-visualiser/` — abstract services + components for visualising query results (facet summary, hierarchy, histograms, reference summary). Console modules provide concrete parsers |
| `viewer-support` | Shared helpers for server-data viewer modules | `CatalogPointer.ts`, `VDownloadServerFileButton.vue` |
| `history-component` | Reusable UI for displaying execution history lists | `HistoryComponent.vue` |

## Generic modules

Core evitaLab infrastructure. All of them are registered first in `src/modules/modules.ts`.

| Module | Purpose | Key contents |
|--------|---------|--------------|
| `config` | Runtime configuration of evitaLab | `EvitaLabConfig` — run mode (`STANDALONE`/`DRIVER`), read-only flag, playground mode, system properties parsed from URL query params (`evitalab-*` prefixed, base64-encoded) |
| `storage` | Persistent client-side storage | `LabStorage` — key-value wrapper around browser local storage (`store2` library). Keys must be globally unique |
| `connection` | Connection to an evitaDB server | `Connection` model, `ConnectionService` — resolves the single active connection from system properties, preconfigured connections, or `VITE_DEV_CONNECTION` (dev mode) |
| `database-driver` | All communication with evitaDB server | `EvitaClient` and friends — see [database driver](../database-driver.md) |
| `workspace` | Overall UI structure: tabs, panels, status bar, history | `WorkspaceService`, `TabDefinition`, `workspaceStore` (Pinia) — see [workspace & tabs](../workspace-and-tabs.md) |
| `notification` | Toast notifications | `Toaster` interface + `useToaster()`, `LocalToaster` (vue-toastification, standalone mode), `RemoteToaster` (IPC to evitaLab Desktop, driver mode), `ToasterFactory` |
| `keymap` | Keyboard shortcuts | `Command` enum (`model/Command.ts`), `keyboardShortcutMappings.ts`, `Keymap` service (`bind`/`unbind`/`bindGlobal`, scoped per tab context), keymap viewer tab |
| `i18n` | Localization messages | `en.json` — single message catalog, namespaced by module (see [i18n](../i18n.md)) |
| `desktop-support` | Integration with evitaLab Desktop app (driver run mode) | `ipc/` — IPC bridges (e.g. notifications) |

## Feature modules

User-facing features. Each one typically contributes one or more tab types and/or panels.

| Module | Purpose |
|--------|---------|
| `welcome-screen` | Landing screen (standalone mode), including its own Pinia store (`welcomeScreenStore`) |
| `connection-explorer` | Left panel tree — catalogs and collections of the connected server, incl. catalog/collection management actions (create, rename, drop, …). When the server is unreachable at load, the panel disables its server-related menu actions and runs a silent 5 s retry loop that recovers on its own (repopulating status + catalogs, re-enabling the actions) once the server responds again — no manual **Reload** or page refresh needed. Catalog loading is gated on server reachability: when the server status reports the server is unreachable the panel skips the catalog fetch entirely, so clicking **Reload** against a down server shows a single server-status error rather than one failure per cleared cache. |
| `entity-viewer` | Grid-based entity browser. Builds and executes queries in evitaQL or GraphQL (`QueryBuilder`/`QueryExecutor` abstraction), renders entity properties with formatters, property selector, price renderer |
| `evitaql-console` | Console tab for executing evitaQL queries, with history and result visualisation |
| `graphql-console` | Console tab for executing GraphQL queries against catalog data/schema/system APIs, with history and result visualisation |
| `schema-viewer` | Browsing catalog/entity/attribute/reference/… schemas, with deep-linkable schema paths (`schema-path-factory`). The representative "flags" (chips) rendered next to each schema item come from the model class's `representativeFlags` getter (in `database-driver`). For attribute schemas the base `AttributeSchema` owns the canonical flag order (type → subclass prefix flags → uniqueness → sortable → filterable → localized → nullable); subclasses extend only narrow protected hooks (`prefixFlags`, `uniquenessFlags`, `isImplicitlyFilterable`) instead of reimplementing the getter, so the flag set can't drift between attribute-list levels. A unique attribute is treated as implicitly filterable. `Flag.icons` always carries raw `EntityScope` values; `SchemaContainerSectionListItem.vue` is the only place that maps them to mdi icons via `EntityScopeIcons`. Model-class getters use `i18n.global.t` (never `useI18n()`, which throws outside component setup). |
| `server-viewer` | Server status/details view. Its 5 s poll force-refreshes server metadata through the cache (`getServerStatus(forceRefresh: true)`) so stats advance instead of returning a frozen cached value; each successful refresh also fires the server-status callbacks, keeping the connection panel's menu in sync without its own polling. When a poll fails (server went down while the tab is open) the body swaps the stat tiles for an "unavailable" indicator instead of showing stale data, and keeps polling silently so it recovers on its own once the server is back; the manual reload button still surfaces the error via a toast. |
| `server-file-viewer` | Listing and downloading files exposed by the server |
| `backup-viewer` | Catalog backup & restore management |
| `task-viewer` | Server background task monitoring |
| `jfr-viewer` | Java Flight Recorder recordings management |
| `traffic-viewer` | Capturing and inspecting server traffic recordings |
| `history-viewer` | Mutation history (CDC) viewer |
| `error-viewer` | Error tab shown when something fails to open properly |
| `keymap` (viewer part) | Keymap tab listing all keyboard shortcuts |

## Module dependency rules

- Feature modules may depend on abstract and generic modules; avoid dependencies between feature
  modules (known exception: `EvitaClient.queryCatalogUsingGraphQL()` references
  `graphql-console`'s `GraphQLInstanceType`).
- Abstract modules must not depend on feature modules.
- The `base` module must not depend on any other module.
- Cross-module access goes through injected services, never by reaching into another module's
  internal state.
