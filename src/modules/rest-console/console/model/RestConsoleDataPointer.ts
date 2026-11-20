import { CatalogPointer } from '@/modules/viewer-support/model/CatalogPointer'
import { Connection } from '@/modules/connection/model/Connection'
import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'

/**
 * Catalog name of the {@link RestInstanceType.System} instance. The instance is not bound to any catalog, but the
 * name is still a part of its identity: the specification cache, the console history key and the serialized tab
 * params are all keyed by (catalog name, instance type). The request URL is built from the instance type alone.
 */
export const restSystemCatalogName: string = 'system'

/**
 * Points to a concrete evitaDB REST API instance.
 */
export class RestConsoleDataPointer extends CatalogPointer {
    readonly instanceType: RestInstanceType

    constructor(connection: Connection, catalogName: string, instanceType: RestInstanceType) {
        super(connection, catalogName)
        this.instanceType = instanceType
    }
}
