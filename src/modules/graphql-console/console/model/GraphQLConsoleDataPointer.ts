import { CatalogPointer } from '@/modules/connection/model/CatalogPointer'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { Connection } from '@/modules/connection/model/Connection'

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
