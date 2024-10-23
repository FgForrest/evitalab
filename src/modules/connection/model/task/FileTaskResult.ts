import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'
import { TaskResult } from '@/modules/connection/model/task/TaskResult'

/**
 * Actual result of finished server task represented by a downloadable file.
 */
export class FileTaskResult implements TaskResult {

    readonly value: ServerFile

    constructor(value: ServerFile) {
        this.value = value
    }
}
