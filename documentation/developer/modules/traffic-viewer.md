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
task and auto-downloads the finished ZIP.

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
