# `traffic-viewer` — capturing and inspecting server traffic

Feature module. Two tabs: **Traffic Recordings** (`TabType.TrafficRecordingsViewer`) for managing
recordings and their files, and **Active traffic recording** (`TabType.TrafficRecordHistoryViewer`) for
browsing the record history of one catalog.

- **Provides:** `trafficViewerServiceInjectionKey`,
  `trafficRecordingsViewerTabFactoryInjectionKey`, `trafficRecordHistoryViewerTabFactoryInjectionKey`
- **Injects:** `evitaClientInjectionKey`, `workspaceServiceInjectionKey`,
  `evitaQLConsoleTabFactoryInjectionKey`, `graphQLConsoleTabFactoryInjectionKey`,
  `trafficRecordHistoryViewerTabFactoryInjectionKey`

## Layout

| Path | What's in it |
|------|--------------|
| `components/TrafficRecordingsViewer.vue` | Recordings tab — running-tasks list + finished-files list |
| `components/TrafficRecordHistoryViewer.vue` | History tab — toolbar + `RecordHistory` |
| `components/RecordHistory*.vue` | The record list, its filter, items and item detail |
| `components/RecordMetadata*.vue` | Metadata rendering for a record |
| `components/Start/EndRecording*.vue` | Start/stop an on-demand recording |
| `components/ExportTrafficBufferButton.vue`, `ExportTrafficBufferDialog.vue` | On-demand buffer export (below) |
| `components/StartPointerButton.vue`, `VLabelSelect.vue` | History start pointer, label filter input |
| `model/` | Tab definitions/params/data, `TrafficRecordHistoryCriteria`, `UserTrafficRecordType`, `TrafficRecorderTask`, `TrafficRecordingExportTask`, visualisation contexts |
| `service/*ContainerVisualiser.ts` | One visualiser per record type (session start/close, query, source query + statistics, fetch, enrichment, mutation) |
| `service/TrafficRecordHistoryVisualisationProcessor.ts` | Turns raw records into `TrafficRecordVisualisationDefinition`s |
| `service/TrafficViewerService.ts` | The module's service |

## Applying the record history filter

`Ctrl+Enter` (`Command.TrafficRecordHistoryViewer_ApplyFilter`) applies the filter and reloads the record
history, **also when nothing changed**, so it doubles as a reload from the filter row; the apply button is
therefore always visible. `RecordHistoryFilter.vue` exposes `apply()` via `defineExpose` and
`TrafficRecordHistoryViewer.vue` binds the command (the filter has no access to the tab id). `apply()` is
async and can reject, so the call site catches and toasts.

The form is `@submit.prevent` — a bare `@submit` lets Enter in a text field trigger a native form
submission, i.e. a full page reload — and the submit button relies on `type="submit"` alone; adding an
`@click` as well fires the apply twice. That shortcuts reach a focused `INPUT` at all is the keymaster
filter override described in [`keymap`](keymap.md).

This mirrors [`history-viewer`](history-viewer.md) exactly; the two are separate implementations, so
changes here need porting there and vice versa.

## Record visualisation

Raw traffic records are not rendered directly. `TrafficRecordHistoryVisualisationProcessor` runs a list
of `TrafficRecordVisualiser` implementations (registered in `TrafficViewerModuleRegistrar`) to produce
`TrafficRecordVisualisationDefinition`s. Several visualisers link out to a query console — which is why
this module injects the evitaQL and GraphQL console tab factories — and `SessionStartContainerVisualiser`
links to a history tab scoped to that session, hence the self-injection of its own tab factory.

## Export traffic buffer

`ExportTrafficBufferButton.vue` + `ExportTrafficBufferDialog.vue` in the record-history toolbar download
a point-in-time snapshot of the server's rolling traffic buffer on demand. The dialog collects an
optional chunk file size (empty ⇒ server default) and starts the export; the button then polls the export
task and auto-downloads the finished ZIP. Its determinate spinner covers both phases — the task's own
progress while exporting, then the transfer progress reported by
[`fetchFile`](../database-driver.md#downloading-server-files) while downloading (throttled to 250 ms).

The recordings list reloads every 5 s through [`useAutoReload`](viewer-support.md#useautoreload), like the
[`jfr-viewer`](jfr-viewer.md) one.

Two traps:

- The RPC needs a **read-write** session (`EvitaSession.exportTrafficRecording` rejects read-only ones),
  so the service uses `updateCatalog`, not `queryCatalog`.
- A missing recorder surfaces as a **failed task**, not an RPC error, because the server creates the
  task before the engine checks. The button therefore matches the failed task's `exception` and emits
  `unavailable`.

### Availability is not a config flag

There is no RPC exposing "traffic recording enabled in config". Availability means **a rich recorder is
installed** — recording enabled in server config **or** an on-demand recording running. Of the four
combinations, only *disabled + nothing running* has no buffer. The client derives this from the signal
the history panel already has: `RecordHistory.vue` emits `update:recorderAvailable` after every fetch
attempt (`fetchError !== NoActiveTrafficRecording`, emitted from a `finally` so the
reset-to-`undefined` round trip can't be coalesced away). When false the button renders **disabled** with
an explanatory tooltip — the tooltip sits on a wrapping `<span>`, because a disabled Vuetify button
swallows pointer events.

### Where exports end up

Export tasks and their finished archives are reachable from the Traffic Recordings viewer
(`trafficRecordingExportTaskName` in both `shownTaskTypes` and the `listFilesToFetch` origin filter) and
from the global Task Viewer. Two guards there:

- The stop-recording button is limited to `TrafficRecorderTask` items — a running export would otherwise
  offer a stop the server rejects.
- Because that task list also shows `Failed` tasks, its two signals stay separate: `TaskList` emits
  `update:tasks` alongside `update:activeJobsPresent`, and the viewer derives list visibility (plus the
  following subheader) from "any task listed" but the **Start recording** disable from
  "a `TrafficRecorderTask` is listed". Gating the button on the whole list would let one lingering failed
  export block starting a recording until the server ages the task out.

## Related

- [`database-driver`](database-driver.md) — `exportTrafficRecording`, `getTaskStatus`, the
  traffic-recording model
- [`task-viewer`](task-viewer.md) — `TaskList` and the global task tab
- [`evitaql-console`](evitaql-console.md), [`graphql-console`](graphql-console.md) — visualiser link targets
- [`viewer-support`](viewer-support.md) — `VDownloadServerFileButton`
