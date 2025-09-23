import type { TabData } from '@/modules/workspace/tab/model/TabData'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import type { MutationHistoryViewerTabDataDto } from '@/modules/history-viewer/model/MutationHistoryViewerTabDataDto.ts'

export class MutationHistoryViewerTabData implements TabData<MutationHistoryViewerTabDataDto> {

    readonly from?: OffsetDateTime
    readonly to?: OffsetDateTime
    readonly entityPrimaryKey?: number


    constructor(from: OffsetDateTime, to: OffsetDateTime, entityPrimaryKey: number) {
        this.from = from
        this.to = to
        this.entityPrimaryKey = entityPrimaryKey
    }

    toSerializable(): MutationHistoryViewerTabDataDto {
        return {
            from: this.from != undefined
                ? {
                    seconds: String(this.from.timestamp.seconds),
                    nanos: this.from.timestamp.nanos,
                    offset: this.from.offset
                }
                : undefined,
            to: this.to != undefined
                ? {
                    seconds: String(this.to.timestamp.seconds),
                    nanos: this.to.timestamp.nanos,
                    offset: this.to.offset
                }
                : undefined,
            entityPrimaryKey: this.entityPrimaryKey

        }
    }
}
