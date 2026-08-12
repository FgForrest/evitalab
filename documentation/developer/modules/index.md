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
├── model/                       # the module's vocabulary — types, enums, constant data
├── exception/                   # error types, and error classification — nothing else
├── service/                     # behavior over the model — injectable services and plain functions
└── workspace/                   # tab integration (TabDefinition, TabParams, TabData, factory)
    ├── model/
    └── service/
```

Which of those directories a given file belongs in is a convention, not an index entry — see
[guidelines — where a file goes](../guidelines.md#where-a-file-goes) for the rule and its rationale.
One consequence worth stating here, next to the registrars: because being injectable is *not* what
makes something a service, a module may have a `service/` folder and no `ModuleRegistrar` at all —
`code-editor/service/` is entirely plain functions.

**This page is an index.** Each module has its own page under `documentation/developer/modules/`,
named after its directory in `src/modules/` — that is where the detail lives. When you change a
module, update its page; add a row here only when you add or remove a module.

## Abstract modules

Provide common abstract services, models and UI components for other modules. They have no UI feature
of their own.

| Module | Purpose |
|--------|---------|
| [`base`](base.md) | Foundation for everything else — the `V*` component library, base error types, shared dialog/menu/properties-table/tree-view models |
| [`code-editor`](code-editor.md) | CodeMirror 6 editor wrappers and the status-bar integration extension |
| [`console`](console.md) | Shared infrastructure for query consoles — result visualisation (facet summary, hierarchy, histograms, reference summary) |
| [`viewer-support`](viewer-support.md) | Shared helpers for server-data viewers — `CatalogPointer`, `VDownloadServerFileButton`, `useAutoReload` |
| [`history-component`](history-component.md) | Reusable UI for displaying execution history lists |

## Generic modules

Core evitaLab infrastructure. All of them are registered first in `src/modules/modules.ts`.

| Module | Purpose |
|--------|---------|
| [`config`](config.md) | Runtime configuration — run mode, read-only flag, playground mode, URL system properties |
| [`storage`](storage.md) | Persistent client-side storage (`LabStorage` over local storage, `LabServerDataCache` over IndexedDB) |
| [`connection`](connection.md) | Connection to an evitaDB server — the `Connection` model and how the active one is resolved |
| [`database-driver`](database-driver.md) | All communication with evitaDB (`EvitaClient` and friends, `DataCacheRefresher`) — deep-dive: [database driver](../database-driver.md) |
| [`workspace`](workspace.md) | Overall UI structure: tabs, panels, status bar — deep-dive: [workspace & tabs](../workspace-and-tabs.md) |
| [`notification`](notification.md) | Toast notifications — `Toaster`, with local and desktop-IPC implementations |
| [`keymap`](keymap.md) | Keyboard shortcuts — the `Command` enum, mappings and the scoped `Keymap` service |
| [`i18n`](i18n.md) | Localization messages (`en.json`) — deep-dive: [i18n](../i18n.md) |
| [`desktop-support`](desktop-support.md) | Integration with the evitaLab Desktop app (driver run mode) |

## Feature modules

User-facing features. Each one typically contributes one or more tab types and/or panels.

| Module | Purpose |
|--------|---------|
| [`welcome-screen`](welcome-screen.md) | Landing screen (standalone mode), including its own Pinia store |
| [`connection-explorer`](connection-explorer.md) | Left panel tree — catalogs and collections, plus their management actions |
| [`entity-viewer`](entity-viewer.md) | Grid-based entity browser, in evitaQL or GraphQL, incl. the references detail sidepanel |
| [`evitaql-console`](evitaql-console.md) | Console tab for executing evitaQL queries |
| [`graphql-console`](graphql-console.md) | Console tab for executing GraphQL queries (data / schema / system APIs) |
| [`schema-viewer`](schema-viewer.md) | Browsing schemas with deep-linkable schema paths and representative flags |
| [`server-viewer`](server-viewer.md) | Server status/details view, and the poll other modules depend on |
| [`server-file-viewer`](server-file-viewer.md) | Listing and downloading files exposed by the server |
| [`backup-viewer`](backup-viewer.md) | Catalog backup & restore management |
| [`task-viewer`](task-viewer.md) | Server background task monitoring, plus the reusable `TaskList` |
| [`jfr-viewer`](jfr-viewer.md) | Java Flight Recorder recordings management |
| [`traffic-viewer`](traffic-viewer.md) | Capturing and inspecting server traffic recordings, incl. on-demand buffer export |
| [`history-viewer`](history-viewer.md) | Mutation history (CDC) viewer |
| [`error-viewer`](error-viewer.md) | Error tab shown when something fails to open properly |
| [`keymap` (viewer part)](keymap.md) | Keymap tab listing all keyboard shortcuts |

## Module dependency rules

- Feature modules may depend on abstract and generic modules; avoid dependencies between feature
  modules (known exception: `EvitaClient.queryCatalogUsingGraphQL()` references
  `graphql-console`'s `GraphQLInstanceType`).
- Abstract modules must not depend on feature modules.
- The `base` module must not depend on any other module.
- Cross-module access goes through injected services, never by reaching into another module's
  internal state.
