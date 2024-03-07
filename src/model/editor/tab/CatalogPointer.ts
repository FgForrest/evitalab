import { EvitaDBConnection } from '@/model/lab'

/**
 * Points to concrete evitaDB catalog in specific connection.
 */
export abstract class CatalogPointer {
    readonly connection: EvitaDBConnection
    readonly catalogName: string

    protected constructor(connection: EvitaDBConnection, catalogName: string) {
        this.connection = connection
        this.catalogName = catalogName
    }
}
