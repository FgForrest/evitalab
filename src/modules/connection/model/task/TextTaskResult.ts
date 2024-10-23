import { TaskResult } from '@/modules/connection/model/task/TaskResult'

/**
 * Actual result of finished server task represented by a text
 */
export class TextTaskResult implements TaskResult {

    readonly value: string

    constructor(value: string) {
        this.value = value
    }
}
