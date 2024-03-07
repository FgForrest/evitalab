import { EvitaDBConnection } from '@/model/lab'
import { CatalogPointer } from '@/model/editor/tab/CatalogPointer'

/**
 * Points to concrete evitaDB EvitaQL instance
 */
export class EvitaQLDataPointer extends CatalogPointer {
    constructor(connection: EvitaDBConnection, catalogName: string) {
        super(connection, catalogName)
    }
}
