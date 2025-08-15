import type { ChangeCaptureOperation } from '@/modules/database-driver/request-response/cdc/ChangeCaptureOperation.ts'
import type { EngineMutation } from '@/modules/database-driver/request-response/cdc/EngineMutation.ts'

export class ChangeSystemCapture {
    /** the version of the engine where the operation was performed (int64 as string) */
    readonly version: string
    /** the index of the event within the enclosed transaction (0 = lead event) */
    readonly index: number
    /** the operation that was performed */
    readonly operation: ChangeCaptureOperation
    /** optional body of the operation when requested by content */
    readonly systemMutation?: EngineMutation

    constructor(version: string, index: number, operation: ChangeCaptureOperation, systemMutation?: EngineMutation) {
        this.version = version
        this.index = index
        this.operation = operation
        this.systemMutation = systemMutation
    }
}
