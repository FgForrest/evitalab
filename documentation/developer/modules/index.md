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
| `connection-explorer` | Left panel tree — catalogs and collections of the connected server, incl. catalog/collection management actions (create, rename, drop, …) |
| `entity-viewer` | Grid-based entity browser. Builds and executes queries in evitaQL or GraphQL (`QueryBuilder`/`QueryExecutor` abstraction), renders entity properties with formatters, property selector, price renderer |
| `evitaql-console` | Console tab for executing evitaQL queries, with history and result visualisation |
| `graphql-console` | Console tab for executing GraphQL queries against catalog data/schema/system APIs, with history and result visualisation |
| `schema-viewer` | Browsing catalog/entity/attribute/reference/… schemas, with deep-linkable schema paths (`schema-path-factory`) |
| `server-viewer` | Server status/details view |
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
