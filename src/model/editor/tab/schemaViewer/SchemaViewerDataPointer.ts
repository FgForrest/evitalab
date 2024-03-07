import { EvitaDBConnection } from '@/model/lab'

import { SchemaPointer } from '@/model/editor/tab/schemaViewer/SchemaPointer'

/**
 * Points to concrete evitaDB schema (catalog, entity, attributes, ...)
 */
export class SchemaViewerDataPointer {
    readonly connection: EvitaDBConnection
    readonly schemaPointer: SchemaPointer

    constructor(connection: EvitaDBConnection, schemaPointer: SchemaPointer) {
        this.connection = connection
        this.schemaPointer = schemaPointer
    }
}
