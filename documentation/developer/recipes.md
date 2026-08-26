# Recipes

Step-by-step instructions for common implementation tasks. Paths are relative to `src/` unless
noted. Follow the [guidelines](guidelines.md) throughout.

## Create a new injectable service

1. Create the class in `<module>/service/MyService.ts`:

```ts
import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'

export const myServiceInjectionKey: InjectionKey<MyService> = Symbol('myService')

/**
 * Describe what the service does.
 */
export class MyService {
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }
}

export function useMyService(): MyService {
    return mandatoryInject(myServiceInjectionKey)
}
```

2. Provide it in the module's registrar (create `<module>/MyModuleRegistrar.ts` if the module has
   none):

```ts
export class MyModuleRegistrar implements ModuleRegistrar {
    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        builder.provide(myServiceInjectionKey, new MyService(evitaClient))
    }
}
```

3. Register the registrar in `modules/modules.ts` **after** the modules it injects from.
4. In components: `const myService: MyService = useMyService()`.

## Create a new module

1. Create `modules/<my-module>/` with the standard structure (`component/`, `model/`, `service/`,
   optionally `workspace/`).
2. Add a `ModuleRegistrar` if it provides/injects services (see above).
3. Add an i18n namespace to `modules/i18n/en.json`.
4. Document it: create `documentation/developer/modules/<my-module>.md` (named after the directory,
   following the layout of the existing module pages) and add a row linking to it in the
   [module catalog](modules/index.md).

## Add a new tab type

Using `evitaql-console` as the reference implementation
(`modules/evitaql-console/console/workspace/`):

1. **TabType** — add a value to `modules/workspace/tab/model/TabType.ts`.
2. **Params** — `MyTabParams implements TabParams<MyTabParamsDto>` (immutable, e.g. a data pointer
   with connection + catalog name; `toSerializable()` returns the DTO). If the tab should be able
   to execute on open, also implement `ExecutableTabRequest`.
3. **Data** — `MyTabData implements TabData<MyTabDataDto>` for user-editable content (may be an
   empty class if the tab has none).
4. **Definition** — `MyTabDefinition extends TabDefinition<MyTabParams, MyTabData>`, passing
   title, `mdi-*` icon and `markRaw(MyTabComponent)` to the super constructor, and implementing the
   abstract `tabType` accessor:

   ```ts
   get tabType(): TabType {
       return TabType.MyTab
   }
   ```
5. **Factory** — injectable `MyTabFactory implements TabFactory`, declaring `tabType`, `restorable`
   and (only when the tab was ever serialized under a different id) `legacyTabTypeIds`, with
   `restoreFromJson(paramsDto, dataDto?)` and a feature-specific `createNew(...)` on top. Restored
   tabs must not auto-execute queries.
6. **Component** — accepts `TabComponentProps<MyTabParams, MyTabData>`, emits `'ready'` and
   `'update:data'`, exposes `path()` (see
   [workspace & tabs](workspace-and-tabs.md#tab-component-contract)); fills all available space
   and uses `VTabToolbar`.
7. **Init & retry** — if the tab blocks its content on a server call, put that call into a single
   `initialize()` invoked from both `onBeforeMount` and an exposed `retry()`, `emit('ready')` on
   success and `emit('error', asError(e))` on any rejection — never a toast, or the tab renders with
   no data and no way out. Always expose `retry()`; the `:key` remount fallback does not run
   `onUnmounted` under `KeepAlive` and would leak setup-level registrations. Needs no timeout of its
   own — every driver call is already bounded. See
   [loading, errors & retry](workspace-and-tabs.md#loading-errors--retry).
8. **Register in your module registrar** — provide the factory under its injection key so
   components can create tabs, and contribute it into the `TabFactoryRegistry` so the workspace can
   restore and share them:

   ```ts
   const tabFactoryRegistry: TabFactoryRegistry = builder.inject(tabFactoryRegistryInjectionKey)

   const myTabFactory: MyTabFactory = new MyTabFactory(connectionService)
   builder.provide(myTabFactoryInjectionKey, myTabFactory)
   tabFactoryRegistry.register(myTabFactory)
   ```

   Nothing inside the `workspace` module is edited — persistence, restore and share links resolve
   the tab through the registry, and `TabFactoryRegistry.validate()` fails the bootstrap if the
   contribution is forgotten. If another module's registrar needs your factory, make sure it is
   ordered after yours in `modules.ts`.
9. **Open it** from wherever appropriate:

```ts
workspaceService.createTab(myTabFactory.createNew(...))
```

## Add a dialog

Use `VLabDialog`, or `VFormDialog` when the dialog contains a form:

```html
<VFormDialog
    :model-value="modelValue"
    :changed="changed"
    :confirm="confirm"
    :reset="reset"
    @update:model-value="emit('update:modelValue', $event)"
>
    <template #activator="{ props }">
        <slot name="activator" v-bind="{ props }" />
    </template>
    <template #title>{{ t('myFeature.myDialog.title') }}</template>
    <template #default>
        <VTextField v-model="name" :rules="nameRules" />
    </template>
    <template #confirm-button-body>{{ t('common.button.create') }}</template>
</VFormDialog>
```

`confirm: () => Promise<boolean>` performs the action (catching errors → `toaster.error`,
returning `false` on failure). Look at `modules/connection-explorer/component/` for many real
examples.

## Add a keyboard shortcut

1. Add a value to the `Command` enum (`modules/keymap/model/Command.ts`), named
   `<Scope>_<Action>` with value `scope.action`.
2. Map it in `modules/keymap/model/keyboardShortcutMappings.ts`
   (`createKeyboardShortcutMapping(command, baseShortcut, macShortcut?)`).
3. Add the command's i18n localization under `command.*` in `en.json`.
4. Bind in the component, scoped to the tab id, and always unbind:

```ts
const keymap: Keymap = useKeymap()

onMounted(() => {
    keymap.bind(Command.MyFeature_DoThing, tabProps.id, () => doThing())
})
onUnmounted(() => {
    keymap.unbind(Command.MyFeature_DoThing, tabProps.id)
})
```

Use `bindGlobal` (and `unbindGlobal`) only for shortcuts that work everywhere regardless of
focused tab. Buttons triggering the command should show it via `VActionTooltip`/
`VExecuteQueryButton` (`command` prop).

## Call evitaDB

Read (shared session), typically from a service:

```ts
const schema: CatalogSchema = await evitaClient.queryCatalog(
    catalogName,
    async (session) => await session.getCatalogSchema()
)
```

Write (fresh session, invalidates shared session afterwards):

```ts
await evitaClient.updateCatalog(
    catalogName,
    async (session) => await session.createCollection(entityType)
)
```

Details, caching and change callbacks: [database driver](database-driver.md). Component-level
calls must be wrapped in try-catch with `toaster.error` feedback.

## Add execution history to a tab

```ts
const historyKey: TabHistoryKey<MyHistoryRecord> = new TabHistoryKey(
    connection, TabType.MyTab, [catalogName, 'mySection']
)
workspaceService.addTabHistoryRecord(historyKey, record)
const records: MyHistoryRecord[] = workspaceService.getTabHistoryRecords(historyKey)
workspaceService.clearTabHistory(historyKey)
```

Render with `HistoryComponent` (`modules/history-component/HistoryComponent.vue`). Records must be
JSON-serializable (persisted to local storage).

## Store data in local storage

Inject `LabStorage` (`modules/storage/LabStorage.ts`) and use a globally unique key — storage is
shared across all of evitaLab. Prefer module-prefixed keys.

## Add persistent UI state reacting to server changes

Register change callbacks on `EvitaClient`/`EvitaClientManagement` in `onMounted`, refresh your
refs in the callback, and unregister in `onUnmounted` — see
[database driver — caching & change callbacks](database-driver.md#caching--change-callbacks).

## Deep-link into evitaLab from an external application

An e-shop, admin or monitoring application can open a prepared tab in a running evitaLab instance
by hand-building a URL. No knowledge of evitaLab's LZ-string compression and no connection id of
the target instance are needed.

**URL shape:** `<evitaLabUrl>?sharedTab=<unpadded base64url of the JSON payload>`

**Envelope:** `{ "tabType": <string>, "tabParams": { … }, "tabData": { … } }` — `tabData` is
optional, the other two are mandatory.

Prefer **unpadded base64url** (`-`/`_` instead of `+`/`/`, trailing `=` stripped): it needs no
percent-encoding at all. Standard base64 works too, but then `+` must be sent as `%2B`. The
LZ-string format produced by evitaLab's own *Share this tab* dialog stays supported — base64 is an
additional accepted *input* format only.

**Connection:** **omit `connectionId` and `connectionName` entirely.** evitaLab resolves the payload
against the one connection the instance is running with. Do not send `connectionId: null` — it
happens to work, but it is not the supported contract. A `connectionId` that does not match the
target instance triggers the *"Shared tab is broken"* dialog, so an external producer should never
send one.

| `tabType` | `tabParams` | `tabData` (optional) |
|---|---|---|
| `entityViewer` | `catalogName`, `entityType` | `queryLanguage` (`evitaql`/`graphql`), `filterBy`, `orderBy`, `dataLocale`, `displayedProperties[]`, `pageSize`, `pageNumber`, `selectedLayers[]` |
| `evitaQLConsole` | `catalogName` | `query`, `variables` |
| `graphQLConsole` | `catalogName`, `instanceType` (`system`/`data`/`schema`) | `query`, `variables` |
| `schemaViewer` | `schemaPointer: { type, params }` | — |
| `mutationHistoryViewer` | `catalogName` | (complex; omit for external links) |
| `trafficRecordHistoryViewer` | `catalogName` | (complex; omit for external links) |

`schemaPointer.type` ∈ `catalogSchema`, `entitySchema`, `catalogAttributeSchema`,
`entityAttributeSchema`, `referenceAttributeSchema`, `associatedDataSchema`, `referenceSchema`,
`sortableAttributeCompoundSchema`; `schemaPointer.params` carries the subset of
`catalogName` / `entityType` / `referenceName` / `attributeName` / `associatedDataName` that the
type needs (see `SchemaViewerTabFactory.restoreTabParamsFromSerializable`).

The table lists the tab types worth deep-linking into. Technically `SharedTabResolver` accepts any
`TabType` whose factory is `restorable`, which today means all of them — the server / task / backup /
JFR viewers simply carry no parameters worth linking.

The tab types `data-grid`, `dataGrid`, `evitaql-console`, `graphql-console`, `schema-viewer` and
`serverStatus` are still accepted for backward compatibility — **deprecated**, new integrations must
use the values above.

**Worked examples** (unpadded base64url):

*Show one entity in the entity viewer:*
```json
{"tabType":"entityViewer","tabParams":{"catalogName":"evita","entityType":"Product"},"tabData":{"queryLanguage":"evitaql","filterBy":"entityPrimaryKeyInSet(103885)"}}
```
```
?sharedTab=eyJ0YWJUeXBlIjoiZW50aXR5Vmlld2VyIiwidGFiUGFyYW1zIjp7ImNhdGFsb2dOYW1lIjoiZXZpdGEiLCJlbnRpdHlUeXBlIjoiUHJvZHVjdCJ9LCJ0YWJEYXRhIjp7InF1ZXJ5TGFuZ3VhZ2UiOiJldml0YXFsIiwiZmlsdGVyQnkiOiJlbnRpdHlQcmltYXJ5S2V5SW5TZXQoMTAzODg1KSJ9fQ
```

*Open an entity schema:*
```json
{"tabType":"schemaViewer","tabParams":{"schemaPointer":{"type":"entitySchema","params":{"catalogName":"evita","entityType":"Product"}}}}
```
```
?sharedTab=eyJ0YWJUeXBlIjoic2NoZW1hVmlld2VyIiwidGFiUGFyYW1zIjp7InNjaGVtYVBvaW50ZXIiOnsidHlwZSI6ImVudGl0eVNjaGVtYSIsInBhcmFtcyI6eyJjYXRhbG9nTmFtZSI6ImV2aXRhIiwiZW50aXR5VHlwZSI6IlByb2R1Y3QifX19fQ
```

*Prefill the evitaQL console:*
```json
{"tabType":"evitaQLConsole","tabParams":{"catalogName":"evita"},"tabData":{"query":"query(\n  collection('Product')\n)"}}
```
```
?sharedTab=eyJ0YWJUeXBlIjoiZXZpdGFRTENvbnNvbGUiLCJ0YWJQYXJhbXMiOnsiY2F0YWxvZ05hbWUiOiJldml0YSJ9LCJ0YWJEYXRhIjp7InF1ZXJ5IjoicXVlcnkoXG4gIGNvbGxlY3Rpb24oJ1Byb2R1Y3QnKVxuKSJ9fQ
```

Runtime behaviour an integrator will observe:

- Opening the link shows the **"Shared tab found"** confirmation dialog (`TabSharedDialog`) — a
  deep-link is never opened silently.
- The tab is created **without executing** any query (`executeOnOpen: false` on all restore paths).
- The mere presence of `sharedTab` switches evitaLab into **playground mode**, so the deep-linked
  tab is intentionally not persisted into the user's local storage.
- Non-ASCII values are safe: the payload is decoded as UTF-8.
- Keep the whole URL under 2083 characters (`urlCharacterLimit`). Base64 JSON is longer than the
  LZ-string format, so use it for short external deep-links and keep LZ-string for sharing large
  loaded queries.

The payload can also be pasted without a URL into a running instance via the tab bar's `+` →
*Open shared tab*.

## Verify a change in the running app

1. Choose a backend: DEMO (default) or local Dockerized evitaDB
   ([evitaDB server](evitadb-server.md); agents: `evitadb-server` skill).
2. `yarn dev` → `http://localhost:3000/lab`.
3. Exercise the affected UI; watch the browser console and toasts for errors.

## Checklist before opening a PR

- [ ] `yarn typecheck` passes (real whole-program check; keep it at zero errors).
- [ ] `yarn test` passes (add unit tests for new pure logic; regression test for bug fixes).
- [ ] `yarn build` passes (runs `yarn typecheck`, then the production build).
- [ ] `yarn lint` — run it and don't add new violations (the gate is not yet at zero, so it is not part of CI yet).
- [ ] New classes/components have JSDoc; user-facing strings are localized.
- [ ] `documentation/developer/` updated (module catalog, UI components, recipes as applicable).
- [ ] Conventional-commit messages; feature branch off `dev`.
