import { CatalogPointer } from '@/modules/connection/model/CatalogPointer'
import { Connection } from '@/modules/connection/model/Connection'

/**
 * Points to concrete evitaDB GraphQL instance
 */
export class RestConsoleDataPointer extends CatalogPointer {

    constructor(connection: Connection, catalogName: string) {
        super(connection, catalogName)
    }
}
