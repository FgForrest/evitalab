import { Connection } from '@/modules/connection/model/Connection'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'

/**
 * Points to concrete evitaDB schema (catalog, entity, attributes, ...)
 */
export class SchemaViewerDataPointer {
    readonly connection: Connection
    readonly schemaPointer: SchemaPointer

    constructor(connection: Connection, schemaPointer: SchemaPointer) {
        this.connection = connection
        this.schemaPointer = schemaPointer
    }
}
