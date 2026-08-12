# `history-viewer` — mutation history (CDC) viewer

Feature module. Browses a catalog's mutation history via change data capture.
Contributes `TabType.MutationHistoryViewer`.

Note the directory is `history-viewer` but its registrar and types are named
`MutationHistoryViewer*` — the injection key is `historyViewerServiceInjectionKey` while the tab factory
key is `mutationHistoryViewerTabFactoryInjectionKey`.

- **Provides:** `historyViewerServiceInjectionKey`, `mutationHistoryViewerTabFactoryInjectionKey`
- **Injects:** `evitaClientInjectionKey`, `workspaceServiceInjectionKey`,
  `mutationHistoryViewerTabFactoryInjectionKey`

## Contents

| Path | Purpose |
|------|---------|
| `component/MutationHistoryViewer.vue` | The tab — toolbar + history |
| `component/MutationHistory.vue`, `MutationHistoryFilter.vue` | The record list and its filter |
| `component/MutationHistoryItem.vue`, `MutationHistoryItemDetail.vue` | Item rendering |
| `component/RecordMetadata*.vue` | Metadata rendering |
| `component/StartPointerButton.vue` | History start pointer |
| `model/MutationHistoryCriteria.ts`, `MutationHistoryRequest.ts` | Filter criteria and the request built from them |
| `model/MutationHistoryStartPointer.ts` | The start-pointer boundary and the list's pointer arithmetic |
| `model/MutationHistoryDataPointer.ts`, tab definition/params/data | Tab wiring |
| `service/MutationHistoryVisualisationProcessor.ts` | Turns raw captures into visualisation definitions |
| `service/MutationVisualiser.ts` + `MutationHistoryData/Schema/TransactionVisualiser.ts` | One visualiser per capture area |
| `service/MutationHistoryViewerService.ts`, `MutationHistoryViewerTabFactory.ts` | Service and tab wiring |

## Applying the filter

`Ctrl+Enter` (`Command.MutationHistoryViewer_ApplyFilter`) applies the filter and reloads the history —
**also when nothing changed**, so it doubles as a reload from the filter row. Accordingly the apply button
is always visible rather than appearing only after an edit.

The binding lives in `MutationHistoryViewer.vue` (the filter component has no access to the tab id, it
receives only `modelValue` + `dataPointer`); `MutationHistoryFilter.vue` exposes `apply()` via
`defineExpose`, mirroring how the viewer already drives `MutationHistory.vue`. `apply()` is async and can
reject, so the call site catches and toasts. With an immutable filter the filter component does not exist
and the shortcut is a harmless no-op.

Two things this depends on: the form is `@submit.prevent` (a bare `@submit` lets Enter in a text field
trigger a native form submission, i.e. a full page reload), and the submit button carries **no** `@click`
handler — `type="submit"` alone is what runs the apply, having both fires it twice. Shortcuts reaching a
focused `INPUT` at all is the keymaster filter override described in [`keymap`](keymap.md).

The *Entity PK* field is a plain `VTextField`, so it hands over a **string** while
`MutationHistoryCriteria.entityPrimaryKey` (and the gRPC request behind it) is a `number`. The parsing and
validation of that input live in `service/entityPrimaryKeyFilter.ts` — the component must route the raw value
through `parseEntityPrimaryKeyFilter()` rather than assigning it into the criteria directly, otherwise a
string reaches the server. A malformed value is reported by `isEntityPrimaryKeyFilterValid()` as a
validation rule and never narrows the query silently.

Observed with a `VSelect`/`VCombobox` dropdown **open**: Vuetify keeps `document.activeElement` on the
field's `input` (it does not move focus into the overlay's `.v-list-item`), so the override is what makes
the shortcut reachable in that state too. `Ctrl+Enter` then applies the filter without selecting the
highlighted item and leaves the dropdown open.

## Paging and the start pointer

The mutation history API is **reverse-only**: it streams newest records first and
`GetMutationsHistoryPageRequest.sinceVersion` is an **upper** bound (a reverse-pagination anchor), not a
cursor to read forward from. This is the opposite of the traffic viewer's `sinceSessionSequenceId`, which
this list was copied from — assuming the traffic viewer's semantics is what made the start pointer inert.
The mechanics live in [`database-driver`](../database-driver.md#mutation-history-paging-getmutationhistory);
what the list does with them:

- **Anchor.** On the first page no anchor is sent and the server resolves it. `moveNextPagePointer()` then
  pins it to that page's newest catalog version — via `selectNewestVersion()` over the page, *not* its
  first record, because the merged transaction overviews are not ordered by version — with `sinceIndex`
  set to `reverseScanStartIndex`. Later pages reuse it and only advance `page`, so records committed
  mid-paging cannot shift the following pages. There is deliberately **no `+ 1`** on the anchor: the
  server clamps anything above the current catalog version and answers with the whole history.
- **Start pointer** (*Load only records newer than now*). `MutationHistoryStartPointer` holds a single
  exclusive lower bound, `newerThanVersion`, taken from the records **already loaded** — "newer than the
  newest record I have", i.e. *since I last looked*. Anything committed between the last load and the
  click therefore counts as new, and establishing the boundary costs no request. The bound is passed as
  `MutationHistoryRequest.newerThanVersion` and applied client-side by the driver. When the reload comes
  back empty the list shows the `noNewerRecords` toast — without it the pointer flow is mute, since the
  list simply empties. Because the action stays offered while the pointer is active (the button's menu)
  and the empty list is that flow's normal state, triggering it with nothing loaded drops the pointer and
  reloads the full history rather than clearing the badge and leaving the list empty.
- **Load more visibility** is `hasMoreRecords(captureCount, pageSize)` over the **streamed** capture count
  from `MutationHistoryPage`, never the rendered size (which the merged overviews inflate past the page
  size). A partial page means end-of-history or boundary reached; both hide the button. Replace this with
  the server's `hasMore` flag once it exists.
- **Every load forces a fresh session.** `MutationHistoryViewerService.getMutationHistoryList` passes
  `forceNewSession: true`, like the evitaQL console and the entity viewer's query executor. A read-only
  session is a snapshot, and with no anchor sent the server starts the reverse scan at *that session's*
  catalog version — so on the shared session the list never shows mutations committed after it was
  opened, and appears frozen until something else happens to evict it.
- **No watcher drives the reload.** `moveStartPointerToNewest()` and `removeStartPointer()` both `await`
  `reloadHistory()` themselves and are both `async`, because `MutationHistoryViewer.vue` clears
  `historyStartPointerLoading` right after awaiting them — an out-of-band watcher stopped the spinner
  before the data arrived.

`MutationHistoryRequest` is built from a **named-argument object**. It carries a dozen optional,
mostly same-typed values; the positional form let the UI-only `mutableFilters` flag land in the
`loadTransaction` slot. `loadTransaction` is now passed explicitly and still mirrors `mutableFilters`:
transaction-overview rows belong to the full-history view only, and the entity-grid-scoped viewer keeps
its narrow list. Unifying the two is a separate UX decision.

## Immutable filter layout

When `criteria.mutableFilters` is `false` (the state produced by opening a history from an entity grid
cell) the viewer renders a toolbar with **no extension**. The root element then gets the
`mutation-history-viewer--immutable-filter` modifier, which drops `grid-template-rows` and `__body`'s
`top` from `6.5rem` to the plain compact-toolbar `3rem`; without it the layout reserves room for a filter
row that is not there and leaves a ~3.5rem empty band under the title.

(The base branch reserves `104px` for a toolbar that is `112px` with `:extension-height="64"`. That
mismatch is pre-existing and shared verbatim with `TrafficRecordHistoryViewer.vue` — do not "fix" one
viewer's magic number in isolation.)

## Deliberately parallel to `traffic-viewer`

The record-history half of this module mirrors [`traffic-viewer`](traffic-viewer.md)'s: a criteria model,
a filter component, a visualisation processor running per-type visualisers, a start pointer, and
near-identical `RecordMetadata*` components. The two are **separate implementations** (feature modules do
not depend on each other), so a fix in one usually needs porting to the other.

The `Ctrl+Enter` apply, the `@submit.prevent` fix, the removed duplicate `@click` and the always-visible
apply button are in **both**. The paging and start-pointer rework above is **not** portable: it exists
precisely because the two APIs read their `since*` fields in opposite directions. `traffic-viewer` has
since moved its record history to newest-first reverse paging too
([record history paging](traffic-viewer.md#record-history-paging)), but with a cursor of its own — this
list never had that defect, because the mutation history API is reverse-only to begin with. So is the reason `MutationHistoryViewer`'s entity-history button keeps a
local copy of the tab-construction code instead of reusing `entity-viewer`'s
`EntityGridCellMenuFactory`: a feature module must not depend on another feature module.

Its three visualisers split by capture area — **data** mutations, **schema** mutations and
**transaction** boundaries.

## Related

- [`database-driver`](database-driver.md) — `getMutationHistory`, `request-response/cdc/`, and the
  system-CDC stream in `DataCacheRefresher`
- [`traffic-viewer`](traffic-viewer.md) — the parallel record-history implementation
