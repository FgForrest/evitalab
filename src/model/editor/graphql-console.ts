import { EvitaDBConnection } from '@/model/lab'
import { TabRequestComponentProps } from '@/model/editor/editor'

/**
 * Points to concrete evitaDB GraphQL instance
 */
export class GraphQLInstancePointer  {
    readonly connection: EvitaDBConnection
    readonly catalogName: string
    readonly instanceType: GraphQLInstanceType

    constructor(connection: EvitaDBConnection, catalogName: string, instanceType: GraphQLInstanceType) {
        this.connection = connection
        this.catalogName = catalogName
        this.instanceType = instanceType
    }
}

export enum GraphQLInstanceType {
    SYSTEM = 'system',
    DATA = 'data',
    SCHEMA = 'schema'
}

/**
 * Represents props of the LabEditorConsoleGraphQL component.
 */
export interface GraphQLConsoleProps extends TabRequestComponentProps {
    readonly instancePointer: GraphQLInstancePointer
}
