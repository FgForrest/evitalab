# Workspace and tabs (`workspace` module)

The `workspace` module builds the entire evitaLab UI shell: the left panel, the tab area, and the
status bar. Everything a user works with opens as a **tab**. The central API is `WorkspaceService`
(`useWorkspaceService()`), backed by the Pinia `workspaceStore` (internal to the module — access
workspace state only through the service).

```
modules/workspace/
├── service/WorkspaceService.ts     # tabs, history, storage of workspace state
├── service/DemoSnippetResolver.ts  # opens demo code snippets from evitaDB docs
├── service/DemoSnippetHandler.ts   # contract feature modules contribute snippet openers under
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
| `TabDefinition<PARAMS, DATA>` subclass | Describes one tab instance: generated `id`, `title`, `icon`, tab `component`, `params`, `initialData`. Its abstract `tabType` accessor returns the `TabType` the tab is serialized under |
| `TabParams` implementation | Immutable instantiation parameters (e.g. connection + catalog name pointer). Must implement `toSerializable(): TabParamsDto` |
| `TabData` implementation | User-editable data (e.g. query text, variables). Pre-fills the component and is continuously updated back, so tabs can be restored. Must implement `toSerializable(): TabDataDto` |
| `TabParamsDto` / `TabDataDto` | Plain JSON-safe DTO interfaces used for local-storage persistence and share links |
| Tab factory (`...TabFactory`) | Injectable service implementing `TabFactory`, with a feature-specific `createNew(...)` on top. Provided under its own injection key **and** contributed into the `TabFactoryRegistry` by the module's registrar |
| Tab component | Vue component rendered inside the tab; receives `TabComponentProps<PARAMS, DATA>` (`id`, `params`, `data`) |

### Tab factory registry

The workspace has to reconstruct tabs of every feature module (session restore, share links) but
must not depend on any of them. `TabFactoryRegistry` (`tab/service/TabFactoryRegistry.ts`) is the
[contribution point](architecture.md#contribution-points) that inverts that dependency: the
workspace owns the registry and the `TabFactory` contract, feature modules register into it.

```ts
// in the feature module's registrar
const tabFactoryRegistry: TabFactoryRegistry = builder.inject(tabFactoryRegistryInjectionKey)

const entityViewerTabFactory: EntityViewerTabFactory = new EntityViewerTabFactory(connectionService)
builder.provide(entityViewerTabFactoryInjectionKey, entityViewerTabFactory)  // typed access
tabFactoryRegistry.register(entityViewerTabFactory)                          // framework access
```

Both registrations are needed and serve different callers: the typed injection key is what
`useEntityViewerTabFactory()` returns to components wanting `createNew(...)`; the registry entry is
what the workspace uses to deserialize by tab type id.

`TabFactory` members:

| Member | Meaning |
|---|---|
| `tabType` | Canonical `TabType` the factory is indexed under |
| `legacyTabTypeIds?` | Historical ids the tab was serialized under by older evitaLab versions; also resolvable |
| `restorable` | Whether the tab can be reconstructed from its serialized form. `false` excludes the tab from persistence and share links (only the error viewer today — a `LabError` is meaningless outside its session) |
| `restoreFromJson(paramsDto, dataDto?)` | Reconstructs the tab definition. Factories ignoring the data argument simply declare fewer parameters |

Lookups (`getFactory` / `findFactory`) accept the canonical value **and** every legacy id. Legacy
ids in use:

| Factory | Legacy ids |
|---|---|
| `EntityViewerTabFactory` | `data-grid`, `dataGrid` |
| `EvitaQLConsoleTabFactory` | `evitaql-console` |
| `GraphQLConsoleTabFactory` | `graphql-console` |
| `SchemaViewerTabFactory` | `schema-viewer` |
| `ServerViewerTabFactory` | `serverStatus` |

Never remove a legacy id — users still hold sessions and links serialized under it.

Because the wiring is no longer compile-checked, the registry fails fast instead: `register()`
throws `InitializationError` on a duplicate tab type, on a legacy id already taken, or on a legacy
id shadowing a canonical `TabType`; `validate()` — called from `main.ts` after all registrars ran —
throws listing every `TabType` that received no factory.

Timing is safe by construction: restore, share-link and demo-snippet resolution all run from
components after mount, i.e. long after every contribution landed.

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
and it belongs to the request, not the framework. A tab needs no timeout code of its own either:
every server call is already bounded by the driver's default call deadline (see
[database driver — deadlines & cancellation](database-driver.md#deadlines--cancellation)), so a hung
request becomes a rejection the tab reports like any other. A tab only threads a `timeoutMs` when it
wants to *tighten* that bound, and `AbortSignal` is reserved for deliberate cancellation.

**The init contract a tab opts into:**

1. extract initialization into a single `initialize()` function,
2. call it from `onBeforeMount` **and** from the exposed `retry()`,
3. on success `emit('ready')`, on any rejection `emit('error', asError(e))` — never a toast, or the
   tab renders with no data and no way out.

**Always expose `retry()`; never rely on the remount fallback.** `TabWindow` wraps the component in
`<KeepAlive>`, where a `:key` change *deactivates and caches* the old instance instead of unmounting
it — `onUnmounted` never runs. A tab that registers anything at setup top level (a schema-change
callback, a subscription) and releases it in `onUnmounted` would therefore leak one live registration
per retry, each closing over a zombie instance. The remount path remains only as a safety net for
tabs that hold no such registrations.

Tabs adopting the contract today: **GraphQL console** (`GraphQLConsole.vue`, the reference example),
**entity viewer** (`EntityViewer.vue`) and **schema viewer** (`SchemaViewer.vue`). Tabs that emit
`'ready'` synchronously and load their content into an in-body indicator with its own reload — the
task / JFR / backup / traffic-recordings viewers, both history viewers, the server viewer — are
deliberately left out: a tab-level error screen would replace a live, self-healing list with a dead
one and blank the toolbar actions the user needs. Tabs that do neither behave exactly as before (they
simply never leave the loading state until they emit `'ready'`).

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

- `storeOpenedTabs()` serializes all open tabs (as `StoredTabObject`: `TabDefinition.tabType` +
  params/data DTOs) into `LabStorage`, skipping tabs whose factory is not `restorable`;
  `restoreTabsFromLastSession()` restores them on startup by looking the tab type id up in the
  `TabFactoryRegistry` and calling the factory's `restoreFromJson()`. Nothing in `WorkspaceService`
  needs touching for a new tab type — contributing the factory is enough.
- **Selected tab** — tab ids are generated per session (`uuidv4`) and are not part of
  `StoredTabObject`, so the selection is persisted as the *index* of the selected tab within the
  stored tabs (own storage key, written by `storeOpenedTabs()` together with the tabs themselves).
  `WorkspaceService` tracks the selection in `workspaceStore.selectedTabId`; the tab bar
  (`WorkspaceTabWindowList`) reports every switch through `markTabAsSelected(id)` and, right after
  the restore, activates `getSelectedTabId()` — restored tabs are marked as already visited, so the
  "switch to the newly opened tab" logic does not steal the selection.
- **Share links** use `ShareTabObject` (tab type + DTOs in the `?sharedTab=` URL param — the
  *hash*), resolved on startup by `SharedTabResolver` (via `TabSharedDialog`) through the same
  `TabFactoryRegistry`; a tab type that is unknown or not `restorable` is rejected with
  `UnexpectedError`.
  When the resulting URL exceeds the browser-safe length (`urlCharacterLimit`, 2083 chars),
  the share dialog (`ShareTabDialog`) blocks copying the link and offers *Copy hash* instead.
  A running session can import a hash or link at any time through the tab bar's `+` →
  *Open shared tab* action (`OpenSharedTabDialog`), which parses the input via
  `ShareTabObject.fromLinkParamOrUrl()` (accepting a bare hash or a full URL) and resolves it
  through the same `SharedTabResolver` (including the connection troubleshooter).
- **Two accepted hash formats.** `ShareTabObject.fromHash()` first tries to decode the hash as a
  plain base64 (or base64url) encoded JSON payload and falls back to LZ-string decompression.
  Base64 is detected by a successful decode yielding a JSON object with a string `tabType`;
  LZ-string cannot be the detector, because it returns nonsense instead of failing on foreign
  input. **The producer side is unchanged** — `toLinkParam()` still emits LZ-string; base64 is an
  accepted *input* format only, so that external applications can deep-link into evitaLab without
  implementing evitaLab's compression. Such payloads also **omit `connectionId`** entirely
  (`TabParamsDtoWithConnection.connectionId` is therefore optional), and the tab factories resolve
  them against the single connection of the running instance via `ConnectionService.getConnection()`.
  See the [recipe](recipes.md#deep-link-into-evitalab-from-an-external-application) for the payload
  contract.
- **Demo snippets** (`DemoSnippetRequest`, `DemoSnippetResolver`) open evitaQL/GraphQL examples
  from the evitaDB documentation in a console tab. The resolver only fetches the snippet and
  dispatches on its file extension — opening it is a `DemoSnippetHandler` contributed by the
  owning module (`EvitaQLConsoleDemoSnippetHandler` for `evitaql`,
  `GraphQLConsoleDemoSnippetHandler` for `graphql`), registered via
  `demoSnippetResolver.registerHandler(...)` in that module's registrar. Supporting another
  language means contributing another handler, not editing the workspace.
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
2. Create `...TabParams`(+Dto), `...TabData`(+Dto), `...TabDefinition` (implementing the `tabType`
   accessor), `...TabFactory` (implementing `TabFactory`) in `<your-module>/.../workspace/`.
3. Create the tab component honouring the props/events/expose contract.
4. In your module registrar: construct the factory, `provide` it under its injection key **and**
   `register` it into the injected `TabFactoryRegistry` (`modules.ts` ordering applies).
5. Add i18n entries and, if applicable, keymap commands.

Nothing in the `workspace` module is edited — persistence, restore and share links pick the tab up
from the registry.
