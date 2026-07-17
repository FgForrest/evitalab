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
4. Document it in the [module catalog](modules/index.md).

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
   title, `mdi-*` icon and `markRaw(MyTabComponent)` to the super constructor.
5. **Factory** — injectable `MyTabFactory` with `createNew(...)` and
   `restoreFromJson(paramsDto, dataDto)`; provide it in your module registrar. Restored tabs must
   not auto-execute queries.
6. **Component** — accepts `TabComponentProps<MyTabParams, MyTabData>`, emits `'ready'` and
   `'update:data'`, exposes `path()` (see
   [workspace & tabs](workspace-and-tabs.md#tab-component-contract)); fills all available space
   and uses `VTabToolbar`.
7. **Wire restore & sharing** — add your `TabType` to the switches in
   `WorkspaceService.restoreTabsFromLastSession()` / `storeOpenedTabs()` and (if shareable) to
   `SharedTabResolver`.
8. **Open it** from wherever appropriate:

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
