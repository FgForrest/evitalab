import { CatalogPointer } from '@/modules/viewer-support/model/CatalogPointer'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { Connection } from '@/modules/connection/model/Connection'

/**
 * Catalog name of the {@link GraphQLInstanceType.System} instance. The instance is not bound to any catalog, but the
 * name is still a part of its identity: the GraphQL schema cache, the console history key and the serialized tab
 * params are all keyed by (catalog name, instance type). It therefore has to be a stable literal, not `undefined`.
 * The request path itself is built from the instance type alone.
 */
export const systemCatalogName: string = 'system'

/**
 * Points to concrete evitaDB GraphQL instance
 */
export class GraphQLConsoleDataPointer extends CatalogPointer {
    readonly instanceType: GraphQLInstanceType

    constructor(connection: Connection, catalogName: string, instanceType: GraphQLInstanceType) {
        super(connection, catalogName)
        this.instanceType = instanceType
    }
}
