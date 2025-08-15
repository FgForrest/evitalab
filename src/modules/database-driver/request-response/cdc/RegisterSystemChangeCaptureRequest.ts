import type { ChangeCaptureContent } from '@/modules/database-driver/request-response/cdc/ChangeCaptureContent.ts'

export class RegisterSystemChangeCaptureRequest {
    readonly sinceVersion?: bigint
    readonly sinceIndex?: number
    readonly content: ChangeCaptureContent

    constructor(content: ChangeCaptureContent, sinceVersion?: bigint, sinceIndex?: number) {
        this.content = content
        this.sinceVersion = sinceVersion
        this.sinceIndex = sinceIndex
    }
}
