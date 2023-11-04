import { EvitaDBConnection } from '@/model/lab'
import {
    CatalogPointer,
    ExecutableTabRequest,
    TabRequestComponentData,
    TabRequestComponentParams
} from '@/model/editor/editor'

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

export enum GraphQLInstanceType {
    SYSTEM = 'system',
    DATA = 'data',
    SCHEMA = 'schema'
}

/**
 * Represents props of the LabEditorConsoleGraphQL component.
 */
export interface GraphQLConsoleParams extends TabRequestComponentParams, ExecutableTabRequest {
    readonly instancePointer: GraphQLInstancePointer
}

/**
 * Represents injectable/storable user data of the LabEditorConsoleGraphQL component.
 */
export interface GraphQLConsoleData extends TabRequestComponentData {
    readonly query?: string
    readonly variables?: string
}
