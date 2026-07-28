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

## Deliberately parallel to `traffic-viewer`

The record-history half of this module mirrors [`traffic-viewer`](traffic-viewer.md)'s: a criteria model,
a filter component, a visualisation processor running per-type visualisers, a start pointer, and
near-identical `RecordMetadata*` components. The two are **separate implementations** (feature modules do
not depend on each other), so a fix in one usually needs porting to the other.

Its three visualisers split by capture area — **data** mutations, **schema** mutations and
**transaction** boundaries.

## Related

- [`database-driver`](database-driver.md) — `getMutationHistory`, `request-response/cdc/`, and the
  system-CDC stream in `DataCacheRefresher`
- [`traffic-viewer`](traffic-viewer.md) — the parallel record-history implementation
