# `task-viewer` — server background task monitoring

Feature module. Monitors evitaDB's background tasks. Contributes `TabType.TaskViewer` — but its
`TaskList.vue` is also **embedded by other modules**, which makes this module a de-facto shared component
provider despite being a feature module.

- **Provides:** `taskViewerServiceInjectionKey`, `taskViewerTabFactoryInjectionKey`
- **Injects:** `evitaClientInjectionKey`

## Contents

| Path | Purpose |
|------|---------|
| `components/TaskViewer.vue` | The tab body |
| `components/TaskList.vue` | The reusable list (below) |
| `components/TaskListItem.vue`, `TaskTitle.vue`, `TaskIcon.vue`, `TaskProgressBar.vue` | Item rendering |
| `components/CancelTaskButton.vue` | Cancels a cancellable task |
| `components/DownloadTaskFileResultButton.vue` | Downloads a `FileTaskResult` (wraps [`viewer-support`](viewer-support.md)'s button) |
| `components/ShowTaskDetailButton.vue` + `TaskDetailDialog.vue` | Task settings/detail |
| `components/ShowTaskExceptionButton.vue` + `TaskExceptionDialog.vue` | Failed-task exception |
| `components/ShowTaskTextResultButton.vue` + `TaskTextResultDialog.vue` | `TextTaskResult` |
| `model/taskStateToColorMapping.ts`, `taskTypeToIconMapping.ts` | State → colour, task type → icon |
| `services/TaskViewerService.ts`, `TaskViewerTabFactory.ts` | Service and tab wiring |

## `TaskList` is a shared component

`TaskList` is embedded by [`traffic-viewer`](traffic-viewer.md) and [`jfr-viewer`](jfr-viewer.md) to show
their own in-flight tasks, filtered by `states` and `taskTypes` props, with an
`item-append-action-buttons` slot for module-specific actions. It polls on a **2 s `setTimeout` chain**
that is cleared in `onUnmounted`, and stops re-arming after a failure so a down server is not spammed —
recovery is then via the manual reload it exposes through `defineExpose`.

**Two emits, deliberately separate:**

- `update:activeJobsPresent` — "is anything listed at all"
- `update:tasks` — the listed tasks themselves

Embedders that gate an action must use `update:tasks` and filter by task type. Gating on
"anything listed" is a trap, because the filters usually include `Failed`: one lingering failed task of
an unrelated type would disable the action until the server ages it out. See
[`traffic-viewer`](traffic-viewer.md) for the concrete case.

## Adding a task type

Task types are server-side class names surfaced by [`database-driver`](database-driver.md); modules
declare the ones they care about as constants (e.g. `trafficRecorderTaskName`). To make one look right
here, add it to `taskTypeToIconMapping`.

## Related

- [`database-driver`](database-driver.md) — `listTaskStatuses`, `getTaskStatus`, `cancelTask`,
  the `TaskStatus`/`TaskState`/`TaskResult` model
- [`traffic-viewer`](traffic-viewer.md), [`jfr-viewer`](jfr-viewer.md), [`backup-viewer`](backup-viewer.md) — embedders
