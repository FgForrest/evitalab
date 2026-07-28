# `viewer-support` — shared helpers for server-data viewers

Abstract module. A deliberately tiny module holding the two things the server-data viewer modules
(`backup-viewer`, `jfr-viewer`, `traffic-viewer`, `server-file-viewer`, …) would otherwise duplicate.
No `ModuleRegistrar`, no injectable services.

## Contents

| File | Purpose |
|------|---------|
| `model/CatalogPointer.ts` | Identifies a catalog on a connection — the common shape viewer tab params build on |
| `component/VDownloadServerFileButton.vue` | Universal "download this `ServerFile` to the user" icon button |

## `VDownloadServerFileButton`

Owns the whole download path so no module reimplements it: `EvitaClient.management.fetchFile(fileId)`
→ blob → object URL → generated `<a download>` click. It has three states
(`CanBeDownloaded` / `Preparing` / `Downloaded`) and stays disabled for 3 s after a download, because
browsers need time before the file actually lands. Failures are emitted as an `error` event rather
than toasted here — the calling module supplies the message, which is why
`task-viewer`'s `DownloadTaskFileResultButton` and `server-file-viewer`'s `DownloadServerFileButton`
exist as thin wrappers around it.

## Related

- [UI components](../ui-components.md)
- [`database-driver`](database-driver.md) — `fetchFile` and the `ServerFile` model
