# `jfr-viewer` — Java Flight Recorder recordings

Feature module. Starting, stopping and downloading JFR recordings from the server.
Contributes `TabType.JfrViewer`.

- **Provides:** `jfrViewerServiceInjectionKey`, `jfrViewerTabFactoryInjectionKey`
- **Injects:** `evitaClientInjectionKey`

## Contents

| Path | Purpose |
|------|---------|
| `components/JfrViewer.vue` | The tab body — running tasks + finished recordings |
| `components/StartRecordingButton.vue` + `StartRecordingDialog.vue` | Start a recording, choosing which JFR event types to capture |
| `components/EndRecordingButton.vue` + `EndRecordingDialog.vue` | Stop the running recording |
| `components/RecordingList.vue`, `RecordingTitle.vue` | Finished recordings |
| `model/JfrRecorderTask.ts` | Server task-type name constant |
| `service/JfrViewerService.ts`, `JfrViewerTabFactory.ts` | Service and tab wiring |

## Shape shared with `traffic-viewer`

This module and [`traffic-viewer`](traffic-viewer.md)'s recordings tab are near-identical in shape —
start/stop dialogs, an embedded [`task-viewer`](task-viewer.md) `TaskList` for in-flight recordings, and a
file list of finished ones filtered by the module's task-type name. Changes to one are often worth
mirroring in the other, but note the two modules do **not** share code — except for the periodic reload
of the recording list, which both drive through
[`useAutoReload`](viewer-support.md#useautoreload) (5 s, survives a dropped connection with a capped
backoff and one toast per outage).

## Event types

`StartRecordingDialog` offers the server's available JFR event types, fetched via
`EvitaClient.management.listJfrRecordingEventTypes()`; recording itself is
`startJrfRecording(allowedEvents)` / `stopJfrRecording()`.

Servers expose dozens of event types and the dialog pre-selects **all** of them, so the picker does not
render the selection as chips — a `#selection` slot collapses it to a `{count} events selected` caption on
the first item only, keeping the field one line high. This is the same pattern as the type filters in
[`traffic-viewer`](traffic-viewer.md) and [`history-viewer`](history-viewer.md).

A `#prepend-item` row toggles the whole list (*Select all* / *Deselect all*, with an indeterminate
checkbox for a partial selection). It deliberately ignores the autocomplete's current search text and
always applies to every event type — Vuetify does not expose the filtered item set to that slot, and a
toggle whose meaning depended on an invisible filter would be worse than one that does not.

## Related

- [`database-driver`](database-driver.md) — the JFR management calls and `request-response/jfr/`
- [`task-viewer`](task-viewer.md) — the embedded task list
- [`viewer-support`](viewer-support.md) — download button
- [`traffic-viewer`](traffic-viewer.md) — the sibling in shape
