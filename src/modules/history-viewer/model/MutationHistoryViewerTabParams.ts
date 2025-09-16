import type { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { Connection } from '@/modules/connection/model/Connection'
import type { MutationHistoryViewerTabParamsDto } from '@/modules/history-viewer/model/MutationHistoryViewerTabParamsDto.ts'

export class MutationHistoryViewerTabParams implements TabParams<MutationHistoryViewerTabParamsDto> {

    readonly connection: Connection
    readonly catalogName: string

    constructor(connection: Connection, catalogName: string) {
        this.connection = connection
        this.catalogName = catalogName
    }

    toSerializable(): MutationHistoryViewerTabParamsDto {
        return {
            connectionId: this.connection.id,
            connectionName: this.connection.name,
            catalogName: this.catalogName,
        }
    }
}
