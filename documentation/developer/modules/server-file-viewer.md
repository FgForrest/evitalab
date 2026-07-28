# `server-file-viewer` — files exposed by the server

Feature module. Lists and downloads the files evitaDB offers for fetching. It contributes **no tab of
its own** — its `ServerFileList` is embedded by the modules that produce files.

- **Provides:** `serverFileViewerServiceInjectionKey` → `ServerFileViewerService`
- **Injects:** `evitaClientInjectionKey`

## Contents

| File | Purpose |
|------|---------|
| `component/ServerFileList.vue` | The reusable paginated file list |
| `component/ServerFileListItem.vue`, `ServerFileTitle.vue` | Item rendering |
| `component/DownloadServerFileButton.vue` | Download action (wraps [`viewer-support`](viewer-support.md)'s `VDownloadServerFileButton`) |
| `component/DeleteServerFileButton.vue` + `DeleteServerFileDialog.vue` | Delete a file from server storage |
| `service/ServerFileViewerService.ts` | Listing and deletion through `EvitaClient.management` |

## `ServerFileList` is a shared component

`backup-viewer`, `jfr-viewer` and `traffic-viewer` each render their finished artefacts through
`ServerFileList`, passing a subheader slot and their own loading logic. Files are filtered
server-side by **origin** — the task type that produced them (e.g. `TrafficRecorderTask`,
`TrafficRecordingExportTask`) — via `listFilesToFetch(pageNumber, pageSize, origin)`. A module that adds a
new file-producing task must add that origin to its own listing call, or the files stay invisible.

## Related

- [`database-driver`](database-driver.md) — `listFilesToFetch`, `fetchFile`, `deleteFile`, `ServerFile`
- [`viewer-support`](viewer-support.md) — the underlying download button
- [`backup-viewer`](backup-viewer.md), [`jfr-viewer`](jfr-viewer.md), [`traffic-viewer`](traffic-viewer.md) — embedders
