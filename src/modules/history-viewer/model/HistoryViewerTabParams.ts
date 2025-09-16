import type { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { Connection } from '@/modules/connection/model/Connection'
import type { HistoryViewerTabParamsDto } from '@/modules/history-viewer/model/HistoryViewerTabParamsDto.ts'

export class HistoryViewerTabParams implements TabParams<HistoryViewerTabParamsDto> {

    readonly connection: Connection
    readonly catalogName: string

    constructor(connection: Connection, catalogName: string) {
        this.connection = connection
        this.catalogName = catalogName
    }

    toSerializable(): HistoryViewerTabParamsDto {
        return {
            connectionId: this.connection.id,
            connectionName: this.connection.name,
            catalogName: this.catalogName,
        }
    }
}
