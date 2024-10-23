import { Connection } from '@/modules/connection/model/Connection'
import { CatalogPointer } from '@/modules/connection/model/CatalogPointer'

/**
 * Points to concrete evitaDB EvitaQL instance
 */
export class EvitaQLConsoleDataPointer extends CatalogPointer {
    constructor(connection: Connection, catalogName: string) {
        super(connection, catalogName)
    }
}
