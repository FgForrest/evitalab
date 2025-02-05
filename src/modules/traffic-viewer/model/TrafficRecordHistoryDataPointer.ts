import { CatalogPointer } from '@/modules/connection/model/CatalogPointer'
import { Connection } from '@/modules/connection/model/Connection'

export class TrafficRecordHistoryDataPointer extends CatalogPointer {

    constructor(connection: Connection, catalogName: string) {
        super(connection, catalogName)
    }
}
