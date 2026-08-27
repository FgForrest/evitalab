# `workspace` — overall UI structure

Generic module, registered last among the base generic modules. Owns the shell every feature module
plugs into: the tab framework, the left panel, the status bar, and the top-level views.

> **This module has a dedicated deep-dive: [workspace & tabs](../workspace-and-tabs.md).**
> That document is the reference for the tab lifecycle, params/data serialisation and tab sharing.
> This page is orientation only.

- **Provides:** `tabFactoryRegistryInjectionKey` → `TabFactoryRegistry`,
  `workspaceServiceInjectionKey` → `WorkspaceService`,
  `sharedTabResolverInjectionKey` → `SharedTabResolver`,
  `demoSnippetResolverInjectionKey` → `DemoSnippetResolver`
- **Injects:** `evitaLabConfigInjectionKey`, `labStorageInjectionKey`

The registrar and the three services above import **no** feature module, even though they have to
reconstruct any tab type from a stored or shared descriptor: they do so through contracts the
workspace owns itself — `TabFactory` entries in the `TabFactoryRegistry` and `DemoSnippetHandler`s in
the `DemoSnippetResolver` — which feature modules contribute into during their own registration. See
[architecture — contribution points](../architecture.md#contribution-points).

The shell **components** are a different story and still compose feature components directly:
`view/*MainView.vue` embed `ConnectionExplorerPanel`, `WorkspaceTabWindowList` embeds
`WelcomeScreen`, and several components use the `keymap` module's `Command`/`Keymap`/
`KeymapViewerTabFactory`. That is composition of the shell's own layout, not deserialization
dispatch, and it is deliberately left as is.

## Layout

| Path | What's in it |
|------|--------------|
| `view/` | `Layout.vue`, `StandaloneMainView.vue`, `DriverMainView.vue` — the two run-mode shells |
| `tab/model/` | `TabDefinition`, `TabType`, `TabParams`/`TabParamsDto`, `TabData`/`TabDataDto`, `TabComponentProps`/`Events`/`Expose`, `TabHistoryKey`, `void/` no-op variants |
| `tab/component/` | `TabWindow`, `WorkspaceTabWindowList`, `TabLoadingScreen`, `ShareTabButton`/`ShareTabDialog`, `OpenSharedTabDialog`, `TabSharedDialog`, `TabSharedTroubleshooterDialog` |
| `tab/service/` | `TabFactory` (contract), `TabFactoryRegistry`, `SharedTabResolver`, `SharedTabTroubleshooterCallback` |
| `tab/error/` | `InvalidConnectionInSharedTabError` |
| `panel/` | `WorkspacePanel.vue`, `ConnectionAvatar.vue`, `ManageMenu.vue`, `ManageMenuFactory`, `ManageOptionType` |
| `status-bar/` | `WorkspaceStatusBar.vue`, `ChangeStreamIndicator.vue`, `CachedDataIndicator.vue`, `PersistentCacheIndicator.vue`, `EditorStatus.vue`, plus `subject-path-status/` breadcrumbs and `editor-status/` models |
| `service/` | `WorkspaceService` (open/close/activate tabs), `DemoSnippetResolver`, `DemoSnippetHandler` (contract) |
| `store/` | `workspaceStore` (Pinia) — open tabs and workspace state, persisted via [`storage`](storage.md) |

### The manage menu

`ManageMenu.vue` renders whatever `ManageMenuFactory` produces — subheaders and `MenuAction`s keyed by
`ManageOptionType`, exactly like the connection explorer's item menus — and dispatches a click by calling
the selected action's `execute()`. There is no `switch` over option types in the component and no
per-option markup; adding an entry means adding an enum member, a factory line and its
`panel.manage.menu.item.<type>` translation.

The factory takes the *open keymap* callback as an argument instead of injecting
`KeymapViewerTabFactory`: the keymap module is registered after the workspace one, so the factory cannot
inject it at registration time. Everything else the menu does is a `window.open` of a fixed URL.

`Command.System_ManageMenu` (`Ctrl+Alt+M` / `Cmd+Option+M`) toggles the menu open, and the *Keymap* item
carries `Command.System_Keymap`, so both show their shortcut in the keymap viewer and in the tooltips.

### Status-bar indicators

Three of them come from the driver and answer **different** questions, so they may legitimately disagree:

| Indicator | Question | Source |
|---|---|---|
| `ChangeStreamIndicator` | Is the live update channel working? | `DataCacheRefresher.streamStatus` |
| `CachedDataIndicator` | Is what you are looking at verified? | `EvitaClient.dataFreshness` |
| `PersistentCacheIndicator` | Can evitaLab cache on disk at all? | `EvitaClient.persistentCacheAvailable` |

An unreachable server with nothing cached shows a broken stream and verified data. The last two can also be lit
**together**, which is not a contradiction: storage that dies mid-session stops new hydration but leaves whatever
was already restored from disk in memory and still unverified — "there is no cache any more" and "what you are
looking at came from the cache" are both true at that point.

**All three render nothing in their healthy state** — the absent icon is "all good", which keeps the bar quiet on
a normal startup. `PersistentCacheIndicator` is the odd one out in that the user cannot act on it: the browser is
refusing storage ([which cases](storage.md#when-storage-is-unusable)), and it is reported only because a lab that
silently never remembers anything is otherwise indistinguishable from a slow one. See
[database driver — freshness signal](../database-driver.md#freshness-signal).

## `TabType` — the registry of tab types

`tab/model/TabType.ts` enumerates every tab that exists: `entityViewer`, `evitaQLConsole`,
`graphQLConsole`, `schemaViewer`, `keymapViewer`, `errorViewer`, `serverViewer`, `taskViewer`,
`backupViewer`, `jfrViewer`, `trafficRecordingsViewer`, `trafficRecordHistoryViewer`,
`mutationHistoryViewer`. A new tab type must be added here as well as in its own module — and its
factory contributed into the `TabFactoryRegistry`, which `main.ts` checks for completeness against
this very enum right after bootstrap.

## Sharing and demo snippets

`SharedTabResolver` reconstructs a tab from a `ShareTabObject` in a URL, resolving the tab type id
(canonical or legacy) through the `TabFactoryRegistry`. Because a shared tab may name a connection
this instance does not have, it can fail with `InvalidConnectionInSharedTabError`, which the
troubleshooter dialog handles. Queries arriving
this way are **not** executed automatically — see the consent gate in
[design language](../design-language.md#feedback--safety).

`ShareTabObject` accepts two hash formats: the LZ-string payload it produces itself, and plain
base64/base64url encoded JSON, which lets external applications build a deep link without knowing
evitaLab internals. Such payloads omit `connectionId` and are resolved against the single connection
of the running instance; see [workspace & tabs](../workspace-and-tabs.md#persistence-restore-sharing) and
the [recipe](../recipes.md#deep-link-into-evitalab-from-an-external-application).

`DemoSnippetResolver` fetches the snippet from the evitaDB repository and delegates opening it to a
`DemoSnippetHandler` registered for the snippet's file extension by the evitaQL / GraphQL console
modules.

## Related

- [workspace & tabs](../workspace-and-tabs.md) — **the** reference for this module
- [recipes — add a new tab type](../recipes.md#add-a-new-tab-type)
- [`code-editor`](code-editor.md) — feeds the status bar's editor status
