# Workspace and tabs (`workspace` module)

The `workspace` module builds the entire evitaLab UI shell: the left panel, the tab area, and the
status bar. Everything a user works with opens as a **tab**. The central API is `WorkspaceService`
(`useWorkspaceService()`), backed by the Pinia `workspaceStore` (internal to the module — access
workspace state only through the service).

```
modules/workspace/
├── service/WorkspaceService.ts     # tabs, history, storage of workspace state
├── service/DemoSnippetResolver.ts  # opens demo code snippets from evitaDB docs
├── store/workspaceStore.ts         # Pinia store (tabs, tab data, history, status bar)
├── tab/                            # tab framework (models, sharing, error handling)
├── panel/                          # left workspace panel
├── status-bar/                     # bottom status bar
└── view/                           # Layout, StandaloneMainView, DriverMainView
```

## Tab framework

A tab type consists of these pieces (all under the owning feature module, in `workspace/` subdir
by convention):

| Piece | Role |
|-------|------|
| `TabDefinition<PARAMS, DATA>` subclass | Describes one tab instance: generated `id`, `title`, `icon`, tab `component`, `params`, `initialData`. Registered `TabType` enum value identifies it for serialization |
| `TabParams` implementation | Immutable instantiation parameters (e.g. connection + catalog name pointer). Must implement `toSerializable(): TabParamsDto` |
| `TabData` implementation | User-editable data (e.g. query text, variables). Pre-fills the component and is continuously updated back, so tabs can be restored. Must implement `toSerializable(): TabDataDto` |
| `TabParamsDto` / `TabDataDto` | Plain JSON-safe DTO interfaces used for local-storage persistence and share links |
| Tab factory (`...TabFactory`) | Injectable service with `createNew(...)` and `restoreFromJson(paramsDto, dataDto)` methods. Registered in the module's registrar and used by anything that opens the tab |
| Tab component | Vue component rendered inside the tab; receives `TabComponentProps<PARAMS, DATA>` (`id`, `params`, `data`) |

### Tab component contract

- Props: `TabComponentProps<PARAMS, DATA>` — created by `TabDefinition.componentProps()`.
- Events (`TabComponentEvents`): emit `'ready'` once initialized, and `'update:data'` with a new
  `TabData` whenever user data changes (this keeps stored workspace state current — the workspace
  listens and calls `WorkspaceService.replaceTabData()`). Optionally emit `'error', error?` when
  initialization fails — see [loading, errors & retry](#loading-errors--retry).
- Expose (`TabComponentExpose`): `path(): SubjectPath | undefined` — resource path shown in the
  status bar when the tab is focused. Optionally `retry?(): void` — re-runs initialization on retry
  (see below).
- Tab components must fill all available space and use `VTabToolbar` for their toolbar
  (see [UI components](ui-components.md)).
- If the tab supports keyboard shortcuts, bind them scoped to the tab id via the `Keymap` service
  and unbind on unmount (see [recipes](recipes.md#add-a-keyboard-shortcut)).

### Loading, errors & retry

`TabWindow` wraps every tab component and drives a small `loading → ready → failed` state machine
around it, rendering `TabLoadingScreen` until the tab is ready:

- **loading** — spinner shown until the tab emits `'ready'`.
- **ready** — content shown (`@ready` flips it on).
- **failed** — the tab emitted `'error'`; `TabLoadingScreen` switches to its error presentation with
  a **Try again** button. Retry resets the state and calls the tab's `retry()` if it exposes one,
  otherwise remounts the component (a `:key` bump) to re-run `onBeforeMount`.

The framework holds **no timer and no `AbortController`** — a timeout is just one kind of `'error'`,
and it belongs to the request, not the framework. A tab that wants a bounded init owns its own
timeout: create an `AbortSignal.timeout(ms)`, thread it through the service/`EvitaClient` call into
ky (which aborts the request on expiry), and `emit('error', asError(e))` on any rejection. This
turns the previous "stuck forever behind the loading screen on a hung/failed init" behaviour into a
retryable error state.

The GraphQL console (`GraphQLConsole.vue`) is the reference example: it extracts its init into an
`initialize()` used by both `onBeforeMount` and the exposed `retry()`, bounds schema introspection
with `AbortSignal.timeout(15_000)`, and emits `'error'` on failure. Tabs that do neither behave
exactly as before (they simply never leave the loading state until they emit `'ready'`).

### Opening tabs

```ts
const workspaceService: WorkspaceService = useWorkspaceService()
const tabFactory: EvitaQLConsoleTabFactory = useEvitaQLConsoleTabFactory()

workspaceService.createTab(tabFactory.createNew(catalogName))
```

Other useful `WorkspaceService` methods: `getTabDefinitions()`, `getTabDefinition(id)`,
`replaceTabData(id, data)`, `markTabAsVisited(id)`, `getSelectedTabId()`, `markTabAsSelected(id)`,
`destroyTab(id)`, `destroyAllTabs()`.

### Persistence, restore, sharing

- `storeOpenedTabs()` serializes all open tabs (as `StoredTabObject`: `tabType` + params/data DTOs)
  into `LabStorage`; `restoreTabsFromLastSession()` restores them on startup via the tab
  factories' `restoreFromJson()`. New tab types must be wired into the restore switch in
  `WorkspaceService`.
- **Selected tab** — tab ids are generated per session (`uuidv4`) and are not part of
  `StoredTabObject`, so the selection is persisted as the *index* of the selected tab within the
  stored tabs (own storage key, written by `storeOpenedTabs()` together with the tabs themselves).
  `WorkspaceService` tracks the selection in `workspaceStore.selectedTabId`; the tab bar
  (`WorkspaceTabWindowList`) reports every switch through `markTabAsSelected(id)` and, right after
  the restore, activates `getSelectedTabId()` — restored tabs are marked as already visited, so the
  "switch to the newly opened tab" logic does not steal the selection.
- **Share links** use `ShareTabObject` (LZ-string-encoded tab type + DTOs in the `?sharedTab=`
  URL param — the *hash*), resolved on startup by `SharedTabResolver` (via `TabSharedDialog`).
  When the resulting URL exceeds the browser-safe length (`urlCharacterLimit`, 2083 chars),
  the share dialog (`ShareTabDialog`) blocks copying the link and offers *Copy hash* instead.
  A running session can import a hash or link at any time through the tab bar's `+` →
  *Open shared tab* action (`OpenSharedTabDialog`), which parses the input via
  `ShareTabObject.fromLinkParamOrUrl()` (accepting a bare hash or a full URL) and resolves it
  through the same `SharedTabResolver` (including the connection troubleshooter).
- **Demo snippets** (`DemoSnippetRequest`, `DemoSnippetResolver`) open evitaQL/GraphQL examples
  from the evitaDB documentation in a console tab.
- Restored/shared tabs never auto-execute queries (performance & safety) — factories set
  `executeOnOpen: false` when restoring.

Params/data classes must remain backward-compatible in their DTO form where possible — users have
them serialized in local storage and in shared links.

### Executable tabs

Tabs whose params implement `ExecutableTabRequest` (an `executeOnOpen: boolean` flag) execute
their query right after opening — used when opening a console prefilled from another place.

## Tab history

`WorkspaceService` provides generic per-tab-section history (typically executed queries),
persisted in local storage:

```ts
const historyKey = new TabHistoryKey<EvitaQLConsoleHistoryRecord>(
    connection, TabType.EvitaQLConsole, [catalogName, 'queryAndVariables']
)
workspaceService.addTabHistoryRecord(historyKey, record)
workspaceService.clearTabHistory(historyKey)
```

The value type must be JSON-serializable. Rendering history lists is what the shared
`history-component` module's `HistoryComponent.vue` is for.

## Panels

`panel/component/WorkspacePanel.vue` renders the left vertical panel (connection avatar, panel
switches, manage menu). The main views (`StandaloneMainView.vue` / `DriverMainView.vue`) compose
the panel together with the `ConnectionExplorerPanel` from the `connection-explorer` module and
the tab area.

## Status bar

`status-bar/component/WorkspaceStatusBar.vue` renders the bottom bar:

- **Subject path** (`SubjectPathStatus`) — breadcrumb of the focused tab, fed by tab components'
  exposed `path()`.
- **Editor status** (`EditorStatus`) — cursor position etc., integrated with CodeMirror editors via
  `modules/code-editor/extension/workspaceStatusBarIntegration.ts`.
- `ChangeStreamIndicator.vue` — right-most item; a health indicator for the system CDC stream fed by
  `DataCacheRefresher` (`useDataCacheRefresher()`). Shows a check icon with the last-change date while
  the stream is live and an alert icon (with a "reconnecting…" tooltip) while it is broken. See
  [System CDC & DataCacheRefresher](database-driver.md#system-cdc--datacacherefresher).

## Adding a new tab type — checklist

See the full walkthrough in [recipes](recipes.md#add-a-new-tab-type). Summary:

1. Add a `TabType` enum value.
2. Create `...TabParams`(+Dto), `...TabData`(+Dto), `...TabDefinition`, `...TabFactory` in
   `<your-module>/.../workspace/`.
3. Create the tab component honouring the props/events/expose contract.
4. Provide the factory in your module registrar (`modules.ts` ordering applies).
5. Wire the factory into `WorkspaceService.restoreTabsFromLastSession()` (and share-link resolution
   in `SharedTabResolver`) so the tab survives restarts and can be shared.
6. Add i18n entries and, if applicable, keymap commands.
