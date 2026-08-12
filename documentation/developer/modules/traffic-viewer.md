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
| `model/TrafficRecordHistoryCursor.ts` | The backward cursor of the record history paging (below) |
| `service/trafficRecordHistoryPaging.ts` | Record history paging behavior — the capture request builder and page merging (below) |
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
changes here need porting there and vice versa. The newest-first paging described below is the one part
that is **not** a port candidate — `history-viewer` already pages the CDC mutation history in reverse
(`MutationHistoryRequest.sinceVersion`/`sinceIndex` anchored at the newest version of the first page), so
it never had the tail-anchoring defect.

## Record history paging

The record history is anchored at the **newest** end of the server's traffic buffer:

- **Reload** drops everything loaded and fetches the newest page. This — and only this — is how new
  traffic enters the list.
- **Load older** (the `VInfiniteScroll` button at the bottom) pages **backwards**, prepending older
  traffic.
- The list renders **newest first**.

Every read is therefore a reversed read (`getRecordHistoryList(…, reverse = true)`), and the client keeps
a single backward cursor, `TrafficRecordHistoryCursor`:

- it starts with no position at all, which the server answers with the newest records;
- after a page it moves right before that page's oldest record — `(seq, offset - 1)` inside a session,
  `(seq - 1n, undefined)` across a session boundary;
- it is exhausted once it would fall below session 1 (sessions are numbered from 1).

**The record offset must stay unset when the cursor crosses a session boundary.** On a reversed read the
server applies `recordSessionOffset <= sinceRecordSessionOffset` to the boundary session only, so sending
`0` would return just the first record of the preceding session and silently drop the rest of it. This is
why `sinceRecordSessionOffset` is `number | undefined` and not defaulted to `0`.

Before this, the history was anchored at the *oldest* end — every reload restarted at
`sinceSessionSequenceId = 1`, so the refresh button kept re-rendering the oldest records still resident in
the ring buffer and new traffic was reachable only by paging through the entire buffer (issue #458). The
buffer wrapping meanwhile made that window drift, which read as records disappearing from the history.

### Display order is not processing order

`records` (the raw accumulated array) stays **ascending**; only the **root level** of the visualised list
is reversed, in `processRecords()`. Do not reverse `records` — the visualiser pipeline is order-dependent:

- `SessionStartContainerVisualiser` registers the session in the visualisation context, and the query /
  fetch / enrichment / mutation visualisers look it up to attach themselves as its children. A record
  processed before its session start becomes its **own root** and the session grouping collapses.
- `SessionCloseContainerVisualiser` **skips with a `console.warn`** when the session start is not in the
  context yet, losing duration, catalog version and the record/query counts from the session header.

Children therefore keep execution order inside their session, which is the desired reading order anyway.
`test/modules/traffic-viewer/service/recordProcessingOrder.test.ts` guards both directions of this.

A page read backwards also **ends in the middle of a session**, so its oldest records arrive without their
session start. `SessionCloseContainerVisualiser.prepare()` asks the processor to fetch that start
separately, and `insertFetchedSessionStartRecords()` splices it before the **first** record of that
session — not before the record that requested it, which is the session close. Inserting it at the
requesting record would leave every earlier record of the session an orphaned root next to its own
session header.

### Merging pages

`prependOlderTrafficRecords()` reverses a fetched page to ascending, drops records already loaded and
prepends the rest. The dedup is not cosmetic: `TrafficRecordVisualisationContext.addVisualisedSessionRecord()`
**throws** on a session id it already holds and `processRecords()` re-processes the whole accumulated array
on every load, so a single re-fetched `SessionStart` would abort the render and surface as an error toast
with an empty list — not as a duplicate row.

### Start pointer

`StartPointerButton` sets a **floor**: the oldest session the history may reach.
`moveStartPointerToNewest()` reads the newest record and sets the floor to `sessionSequenceOrder + 1`, so
only traffic recorded from that moment on is shown. The server cannot express a lower bound on a reversed
read, so the floor is applied on the client — fetched pages are filtered through `cursor.covers(…)` and
backward paging stops once the cursor drops below it.

### Why recent traffic is missing

Two server-side facts are surfaced by toolbar buttons rather than left for the user to discover:

- A record is written to the traffic buffer only when **its session closes**, and it becomes readable only
  at the next **flush** of that buffer — `server.trafficRecording.trafficFlushIntervalInMilliseconds`,
  one minute by default. The `mdi-information-outline` button explains this. (Forcing a drain before
  serving the history would need an evitaDB-side change; only the export path does that today.)
- evitaLab itself runs on **one long-lived shared session per catalog**
  ([`EvitaClient.queryCatalog`](../database-driver.md)), and an open session is never drained — so traffic
  generated *from evitaLab* (evitaQL/GraphQL console, entity viewer) never appears in the history at all.
  The `mdi-lan-disconnect` **Close shared session** button requests a close of it through
  `TrafficViewerService.closeSharedSession()`, mirroring the catalog menu action in
  [`connection-explorer`](connection-explorer.md).

`EvitaClient.closeSharedSession()` resolves immediately — it only asks the session to close once its
in-flight calls finish — so the toast says the close was *requested*, and the records still wait for the
next flush. It is safe: the next `queryCatalog` transparently opens a new shared session. It is a button
rather than an automatic close on every reload, because auto-closing would discard the session's warm
state on each refresh for a benefit that only applies when the user deliberately inspects evitaLab's own
traffic.

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
