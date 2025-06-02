import { Connection } from '@/modules/connection/model/Connection'

/**
 * Points to concrete evitaDB catalog in specific connection.
 */
export abstract class CatalogPointer {
    readonly connection: Connection
    readonly catalogName: string

    protected constructor(connection: Connection, catalogName: string) {
        this.connection = connection
        this.catalogName = catalogName
    }
}
