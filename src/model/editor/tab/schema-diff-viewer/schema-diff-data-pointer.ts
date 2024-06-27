import { CatalogPointer } from '@/model/editor/editor'
import { EvitaDBConnection } from '@/model/lab'

// todo
export class SchemaDiffDataPointer extends CatalogPointer {

    constructor(connection: EvitaDBConnection, catalogName: string) {
        super(connection, catalogName);
    }
}
