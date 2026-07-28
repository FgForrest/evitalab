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
| `components/BackupList.vue`, `BackupSelector.vue` | Existing backups |
| `components/RestoreBackupFileButton.vue` + `RestoreBackupFileDialog.vue` | Restore from a file already on the server |
| `components/RestoreLocalBackupFileButton.vue` + `RestoreLocalBackupFileDialog.vue` | Upload a local file and restore from it |
| `model/BackupType.ts` | The backup kinds |
| `model/BackupTask.ts`, `FullBackupTask.ts`, `SystemBackupTask.ts`, `SystemFullBackupTask.ts`, `RestoreTask.ts` | Server task-type name constants |
| `service/BackupViewerService.ts`, `BackupViewerTabFactory.ts` | Service and tab wiring |

## Three backup kinds, four task names

The dialogs map onto distinct server tasks, which is why there are several task-name constants: catalog
backup vs. **system** backup, each in snapshot and **full** variants. Filtering task lists or file
listings for "backups" means covering the relevant set of these names, not just `BackupTask`.

## Restore has two paths

Restoring from a **server-side** file and restoring from a **local** upload are different flows: the
local path uploads the file in chunks through
[`database-driver`](database-driver.md)'s `restoreCatalog` before the restore task starts, whereas the
server-side path calls `restoreCatalogFromServerFile` with a file id. Both are long-running and end up as
tasks.

## Related

- [`database-driver`](database-driver.md) — `backupCatalog`, `fullBackupCatalog`, `restoreCatalog`,
  `restoreCatalogFromServerFile`
- [`task-viewer`](task-viewer.md) — where backup/restore tasks show up
- [`server-file-viewer`](server-file-viewer.md) — the resulting files
- [`viewer-support`](viewer-support.md) — download button
