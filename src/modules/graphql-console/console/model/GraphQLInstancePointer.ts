import { CatalogPointer } from '@/model/editor/tab/CatalogPointer'
import { GraphQLInstanceType } from '@/model/editor/tab/graphQLConsole/GraphQLInstanceType'
import { EvitaDBConnection } from '@/model/EvitaDBConnection'

/**
 * Points to concrete evitaDB GraphQL instance
 */
export class GraphQLInstancePointer extends CatalogPointer {
    readonly instanceType: GraphQLInstanceType

    constructor(connection: EvitaDBConnection, catalogName: string, instanceType: GraphQLInstanceType) {
        super(connection, catalogName)
        this.instanceType = instanceType
    }
}
