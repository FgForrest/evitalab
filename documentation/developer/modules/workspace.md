# `workspace` — overall UI structure

Generic module, registered fifth. Owns the shell every feature module plugs into: the tab framework,
the left panel, the status bar, and the top-level views.

> **This module has a dedicated deep-dive: [workspace & tabs](../workspace-and-tabs.md).**
> That document is the reference for the tab lifecycle, params/data serialisation and tab sharing.
> This page is orientation only.

- **Provides:** `workspaceServiceInjectionKey` → `WorkspaceService`,
  `sharedTabResolverInjectionKey` → `SharedTabResolver`,
  `demoSnippetResolverInjectionKey` → `DemoSnippetResolver`
- **Injects:** `evitaLabConfigInjectionKey`, `connectionServiceInjectionKey`,
  `labStorageInjectionKey`, and **every** tab factory it can restore
  (entity-viewer, evitaql-console, graphql-console, schema-viewer, keymap-viewer, …)

That last point is why `workspace` is registered before the feature modules but resolves their
factories lazily — it must be able to reconstruct any tab type from a stored or shared descriptor.

## Layout

| Path | What's in it |
|------|--------------|
| `view/` | `Layout.vue`, `StandaloneMainView.vue`, `DriverMainView.vue` — the two run-mode shells |
| `tab/model/` | `TabDefinition`, `TabType`, `TabParams`/`TabParamsDto`, `TabData`/`TabDataDto`, `TabComponentProps`/`Events`/`Expose`, `TabHistoryKey`, `void/` no-op variants |
| `tab/component/` | `TabWindow`, `WorkspaceTabWindowList`, `TabLoadingScreen`, `ShareTabButton`/`ShareTabDialog`, `OpenSharedTabDialog`, `TabSharedDialog`, `TabSharedTroubleshooterDialog` |
| `tab/service/` | `SharedTabResolver`, `SharedTabTroubleshooterCallback` |
| `tab/error/` | `InvalidConnectionInSharedTabError` |
| `panel/` | `WorkspacePanel.vue`, `ConnectionAvatar.vue`, `ManageMenu.vue`, `ManageOptionType` |
| `status-bar/` | `WorkspaceStatusBar.vue`, `ChangeStreamIndicator.vue`, `EditorStatus.vue`, plus `subject-path-status/` breadcrumbs and `editor-status/` models |
| `service/` | `WorkspaceService` (open/close/activate tabs), `DemoSnippetResolver` |
| `store/` | `workspaceStore` (Pinia) — open tabs and workspace state, persisted via [`storage`](storage.md) |

## `TabType` — the registry of tab types

`tab/model/TabType.ts` enumerates every tab that exists: `entityViewer`, `evitaQLConsole`,
`graphQLConsole`, `schemaViewer`, `keymapViewer`, `errorViewer`, `serverViewer`, `taskViewer`,
`backupViewer`, `jfrViewer`, `trafficRecordingsViewer`, `trafficRecordHistoryViewer`,
`mutationHistoryViewer`. A new tab type must be added here as well as in its own module.

## Sharing and demo snippets

`SharedTabResolver` reconstructs a tab from a `ShareTabObject` in a URL, dispatching on `TabType` to
the right factory. Because a shared tab may name a connection this instance does not have, it can fail
with `InvalidConnectionInSharedTabError`, which the troubleshooter dialog handles. Queries arriving
this way are **not** executed automatically — see the consent gate in
[design language](../design-language.md#feedback--safety).

`ShareTabObject` accepts two hash formats: the LZ-string payload it produces itself, and plain
base64/base64url encoded JSON, which lets external applications build a deep link without knowing
evitaLab internals. Such payloads omit `connectionId` and are resolved against the single connection
of the running instance; see [workspace & tabs](../workspace-and-tabs.md#persistence-restore-sharing) and
the [recipe](../recipes.md#deep-link-into-evitalab-from-an-external-application).

## Related

- [workspace & tabs](../workspace-and-tabs.md) — **the** reference for this module
- [recipes — add a new tab type](../recipes.md#add-a-new-tab-type)
- [`code-editor`](code-editor.md) — feeds the status bar's editor status
