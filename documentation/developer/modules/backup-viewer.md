# `backup-viewer` — catalog backup & restore

Feature module. Creating catalog backups and restoring from them. Contributes `TabType.BackupViewer`.

- **Provides:** `backupViewerServiceInjectionKey`, `backupViewerTabFactoryInjectionKey`
- **Injects:** `evitaClientInjectionKey`

## Contents

| Path | Purpose |
|------|---------|
| `components/BackupViewer.vue` | The tab body |
| `components/BackupCatalogButton.vue` | Main action, opening one of the backup dialogs |
| `components/SnapshotBackupDialog.vue` | Snapshot (current state) backup |
| `components/PointInTimeBackupDialog.vue` | Backup as of a chosen moment |
| `components/FullBackupDialog.vue` | Full backup |
| `components/BackupList.vue` | Existing backups |
| `components/BackupSelector.vue` | Picks the catalog and the backup kind, then opens the matching dialog |
| `components/RestoreBackupFileButton.vue` + `RestoreBackupFileDialog.vue` | Restore from a file already on the server |
| `components/RestoreLocalBackupFileButton.vue` + `RestoreLocalBackupFileDialog.vue` | Upload a local file and restore from it |
| `model/BackupType.ts` | The backup kinds |
| `model/BackupTask.ts`, `FullBackupTask.ts`, `SystemBackupTask.ts`, `SystemFullBackupTask.ts`, `RestoreTask.ts` | Server task-type name constants |
| `service/BackupViewerService.ts`, `BackupViewerTabFactory.ts` | Service and tab wiring |

## Three backup kinds, four task names

The dialogs map onto distinct server tasks, which is why there are several task-name constants: catalog
backup vs. **system** backup, each in snapshot and **full** variants. Filtering task lists or file
listings for "backups" means covering the relevant set of these names, not just `BackupTask`.

## Point-in-time backups are gated on time travel

The server rejects a point-in-time backup when it keeps no historical data, so `BackupSelector` reads
`EngineSettings.timeTravelEnabled` (via `BackupViewerService.isTimeTravelEnabled()`) and disables the
_Point in time_ tile with an explanatory tooltip instead of letting the request fail as a task. Two
details of the implementation are load-bearing:

- The flag is **tri-state** in the component (`boolean | undefined`) and the tooltip renders only for an
  explicit `false`. While the answer is still travelling the reason is unknown, and the tile is already
  disabled until a catalog is picked — asserting a wrong reason would be worse than none.
- It is loaded when the dialog **opens**, not at setup. `BackupSelector` is mounted once per catalog by
  [`connection-explorer`](connection-explorer.md)'s `CatalogItem`, and
  `EvitaServerMetadataCache.getLatestEngineSettings()` is not promise-memoized, so setup-time loading
  would fire one `getEngineSettings` call per catalog in the tree.

The tooltip sits on the whole tile (`activator="parent"`) rather than on the button, because a disabled
Vuetify button emits no pointer events. For the same reason the tile's large icon needs its own guard in
the click handler — `disabled` on `VIcon` is cosmetic and does not suppress `@click`.

## The backup list reloads itself

`BackupList` refreshes every 5 s through [`useAutoReload`](viewer-support.md#useautoreload), so a backup
task that finishes elsewhere shows up without user action. A failed poll retries with a capped backoff
and is toasted once per outage instead of switching auto-refresh off, and `BackupViewer`'s toolbar
refresh calls the exposed `reload(true)`, which bypasses the backoff.

## Restore has two paths

Restoring from a **server-side** file and restoring from a **local** upload are different flows: the
local path uploads the file in chunks through
[`database-driver`](database-driver.md)'s `restoreCatalog` before the restore task starts, whereas the
server-side path calls `restoreCatalogFromServerFile` with a file id. Both are long-running and end up as
tasks.

## Related

- [`database-driver`](database-driver.md) — `backupCatalog`, `fullBackupCatalog`, `restoreCatalog`,
  `restoreCatalogFromServerFile`, `getEngineSettings`
- [`task-viewer`](task-viewer.md) — where backup/restore tasks show up
- [`server-file-viewer`](server-file-viewer.md) — the resulting files
- [`viewer-support`](viewer-support.md) — download button
