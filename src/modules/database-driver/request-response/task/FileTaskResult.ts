import { TaskResult } from '@/modules/database-driver/request-response/task/TaskResult'
import { ServerFile } from '@/modules/database-driver/request-response/server-file/ServerFile'

/**
 * Actual result of finished server task represented by a downloadable file.
 */
export class FileTaskResult implements TaskResult {

    readonly value: ServerFile

    constructor(value: ServerFile) {
        this.value = value
    }
}
