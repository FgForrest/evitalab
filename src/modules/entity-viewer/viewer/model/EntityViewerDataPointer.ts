import { CatalogPointer } from '@/modules/connection/model/CatalogPointer'
import { Connection } from '@/modules/connection/model/Connection'

/**
 * Points to concrete evitaDB collection to fetch data from.
 */
export class EntityViewerDataPointer extends CatalogPointer {
    readonly entityType: string

    constructor(connection: Connection, catalogName: string, entityType: string) {
        super(connection, catalogName)
        this.entityType = entityType
    }
}
