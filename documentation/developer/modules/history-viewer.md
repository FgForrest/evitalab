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

Observed with a `VSelect`/`VCombobox` dropdown **open**: Vuetify keeps `document.activeElement` on the
field's `input` (it does not move focus into the overlay's `.v-list-item`), so the override is what makes
the shortcut reachable in that state too. `Ctrl+Enter` then applies the filter without selecting the
highlighted item and leaves the dropdown open.

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
apply button are in **both**. So is the reason `MutationHistoryViewer`'s entity-history button keeps a
local copy of the tab-construction code instead of reusing `entity-viewer`'s
`EntityGridCellMenuFactory`: a feature module must not depend on another feature module.

Its three visualisers split by capture area — **data** mutations, **schema** mutations and
**transaction** boundaries.

## Related

- [`database-driver`](database-driver.md) — `getMutationHistory`, `request-response/cdc/`, and the
  system-CDC stream in `DataCacheRefresher`
- [`traffic-viewer`](traffic-viewer.md) — the parallel record-history implementation
