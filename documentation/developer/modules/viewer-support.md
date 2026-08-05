# `viewer-support` — shared helpers for server-data viewers

Abstract module. A deliberately tiny module holding the things the server-data viewer modules
(`backup-viewer`, `jfr-viewer`, `traffic-viewer`, `server-file-viewer`, `task-viewer`, …) would
otherwise duplicate. No `ModuleRegistrar`, no injectable services.

## Contents

| File | Purpose |
|------|---------|
| `model/CatalogPointer.ts` | Identifies a catalog on a connection — the common shape viewer tab params build on |
| `component/VDownloadServerFileButton.vue` | Universal "download this `ServerFile` to the user" icon button |
| `composable/useAutoReload.ts` | Periodic reload loop for the viewer lists, resilient to transient failures |

## `VDownloadServerFileButton`

Owns the whole download path so no module reimplements it. It streams the file through
[`EvitaClient.management.fetchFileStream`](database-driver.md) — never buffering the whole file in the
JS heap — reports progress on the button itself and can be cancelled.

### States

`CanBeDownloaded` → `Preparing` → `Downloaded` → (after `downloadCooldown`, 3 s) `CanBeDownloaded`.
A **failure returns to `CanBeDownloaded` immediately**, so the user can retry at once; the button never
claims a download succeeded when it didn't. Failures are emitted as an `error` event rather than
toasted here — the calling module supplies the message, which is why `task-viewer`'s
`DownloadTaskFileResultButton` and `server-file-viewer`'s `DownloadServerFileButton` exist as thin
wrappers around it.

### Progress

`fetchFileStream`'s `onProgress` feeds a determinate `VProgressCircular` in the button's `#loader`
slot, and the tooltip shows `Downloading… 42 % (672 MiB / 1.6 GiB)` (`common.download.*`). The spinner
stays indeterminate until the first chunk arrives, because the total comes from the server's per-chunk
report rather than from the listed `ServerFile.totalSizeInBytes` — the displayed percentage can then
never disagree with the counted bytes. Reactive writes are throttled to
`progressUpdateInterval` (250 ms) — a multi-gigabyte file arrives in tens of thousands of chunks and
updating a `ref` for each of them would starve the decoding loop on the main thread.

### Cancellation

Clicking the button while a download runs aborts it: the click handler passes an `AbortController`
signal into the driver, and unmounting the tab aborts too (previously the stream kept running and the
blob kept growing after the tab was closed). A cancellation is **silent** — no toast, no `error`
event — and is recognized in all three shapes it can take: `ConnectError` with `Code.Canceled` (the
aborted gRPC stream), a `DOMException` named `AbortError` (the save picker dismissed by the user) and
an already-aborted signal.

### Two delivery paths

```
click
 ├─ 'showSaveFilePicker' in window && isSecureContext  → stream straight into the picked file
 └─ otherwise                                          → windowed blob + object URL
```

**Save picker (Chromium, secure context).** `showSaveFilePicker()` is the first `await` in the click
handler — the API requires the user gesture — so nothing is transferred until the user picks a
location, and dismissing the dialog is a silent no-op. Chunks are then written straight to
`FileSystemWritableFileStream`; only one chunk is ever in the heap and no object URL is involved.
Because the picker already created the target entry, a failed or cancelled download leaves an
**unusable file at the location the user chose** — evitaLab calls `writable.abort()` and warns via
`common.notification.downloadIncomplete`, since it cannot delete that file. (Chromium writes into a
swap file that is moved into place only on `close()`, so the leftover is expected to be empty rather
than partially filled; either way it is not the requested file — which is what the message says.) The
warning is suppressed when the abort came from unmounting: a toast about a view the user just closed
would be noise.
`showSaveFilePicker` is not declared in `lib.dom.d.ts` — the minimal shape evitaLab uses is declared
in `src/vite-env.d.ts`.

**Windowed blob (Firefox, Safari, insecure contexts).** Chunks go into `WindowedBlobAccumulator`
(`src/utils/blob.ts`), which wraps every `blobPartWindowBytes` (32 MiB) of chunks into an intermediate
`Blob` and drops the `Uint8Array` references. `new Blob([chunk])` copies the bytes into the engine's
blob storage anyway; doing it per window instead of once at the end makes the consumed chunks garbage
immediately, so **heap residency is one window instead of the whole file** (peak ≈ 2× the file size
before, ≈ 1× plus a window now). The finished blob is handed to the browser through a generated
`<a download>` click; the `<a>` is removed right away and the object URL is revoked on the
`downloadCooldown` timer (not synchronously after `click()`, which can cancel the download in some
browsers) and on unmount.

Known residual: Firefox keeps blob data in memory where Chromium spills large blobs to disk, so
Firefox still holds ≈1× the file size natively on this path. OPFS staging and a Service-Worker
streaming download were considered and rejected — see the issue #388 plan in `.claude/plans/`.

## `useAutoReload`

```ts
useAutoReload(
    load: () => Promise<void>,     // must throw on failure
    interval: number,
    onOutage: (error: unknown) => void
): { reload(manual?: boolean): Promise<void> }
```

The periodic reload loop behind `BackupList`, `TaskList` and both `RecordingList`s. It loads once
immediately, then re-arms itself after every load, and clears its timer when the surrounding effect
scope (the component's setup scope) is disposed.

- **A failure never stops the loop.** It retries with a capped backoff — `5 s, 10 s, 20 s, 60 s`, the
  same schedule the change-stream refresher uses — instead of the previous behaviour, where one failed
  poll disabled auto-refresh for the rest of the tab's life and left the list silently frozen on stale
  data (issue #388).
- **`onOutage` fires at most once per outage.** The next successful load re-arms the reporting, so a
  server that stays down produces one toast, not one every few seconds.
- **A manual `reload(true)`** bypasses the pending backoff, restarts the schedule and re-arms the
  reporting (a failure the user explicitly asked for is worth a toast). This is what the toolbar
  refresh buttons, the `request-file-update` events and the page-number watchers call.

Each list keeps its own `loadX()` — its own service, its own i18n key, its own extra per-cycle work
(`TaskList`'s `update:tasks` / `update:activeJobsPresent` emits, the `pageNumber` decrement when a page
empties) — and only passes it in; the loop itself lives here once.

## Related

- [UI components](../ui-components.md) — the `#loader` progress pattern
- [design language](../design-language.md) — determinate progress and click-to-cancel conventions
- [`database-driver`](database-driver.md) — `fetchFileStream` / `fetchFile` and the `ServerFile` model
