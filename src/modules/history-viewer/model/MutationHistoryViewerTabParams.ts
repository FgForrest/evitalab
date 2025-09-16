import type { TabParams } from '@/modules/workspace/tab/model/TabParams'
import type {
    MutationHistoryViewerTabParamsDto
} from '@/modules/history-viewer/model/MutationHistoryViewerTabParamsDto.ts'
import type { MutationHistoryDataPointer } from '@/modules/history-viewer/model/MutationHistoryDataPointer.ts'

export class MutationHistoryViewerTabParams implements TabParams<MutationHistoryViewerTabParamsDto> {

    readonly dataPointer: MutationHistoryDataPointer


    constructor(dataPointer: MutationHistoryDataPointer) {
        this.dataPointer = dataPointer
    }

    toSerializable(): MutationHistoryViewerTabParamsDto {
        return {
            connectionId: this.dataPointer.connection.id,
            connectionName: this.dataPointer.connection.name,
            catalogName: this.dataPointer.catalogName,
        }
    }
}
