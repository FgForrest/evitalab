import { Map as ImmutableMap } from 'immutable'
import { backupTaskName } from '@/modules/backup-viewer/model/BackupTask'
import { restoreTaskName } from '@/modules/backup-viewer/model/RestoreTask'
import { jfrRecorderTaskName } from '@/modules/jfr-viewer/model/JfrRecorderTask'

/**
 * Icon for tasks that have not assigned any icon
 */
export const fallbackTaskIcon: string = 'mdi-cog-outline'
/**
 * Maps task type to a icon
 */
export const taskTypeToIconMapping: ImmutableMap<string, string> = ImmutableMap([
    [backupTaskName, 'mdi-cloud-download-outline'],
    [restoreTaskName, 'mdi-cloud-upload-outline'],
    [jfrRecorderTaskName, 'mdi-record-circle-outline']
])
