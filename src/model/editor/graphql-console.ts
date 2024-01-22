import { EvitaDBConnection, EvitaDBConnectionId, UnexpectedError } from '@/model/lab'
import {
    CatalogPointer,
    ExecutableTabRequest, SerializableTabRequestComponentData, SerializableTabRequestComponentParams,
    TabRequestComponentData, TabRequestComponentDataDto,
    TabRequestComponentParams, TabRequestComponentParamsDto
} from '@/model/editor/editor'
import { LabService } from '@/services/lab.service'

/**
 * Represents props of the LabEditorConsoleGraphQL component.
 */
export class GraphQLConsoleParams extends SerializableTabRequestComponentParams<GraphQLConsoleParamsDto> implements TabRequestComponentParams, ExecutableTabRequest {
    readonly instancePointer: GraphQLInstancePointer
    readonly executeOnOpen: boolean

    constructor(instancePointer: GraphQLInstancePointer, executeOnOpen: boolean = false) {
        super()
        this.instancePointer = instancePointer
        this.executeOnOpen = executeOnOpen
    }

    static restoreFromSerializable(labService: LabService, json: TabRequestComponentParamsDto): GraphQLConsoleParams {
        const dto: GraphQLConsoleParamsDto = json as GraphQLConsoleParamsDto
        return new GraphQLConsoleParams(
            new GraphQLInstancePointer(
                labService.getConnection(dto.connectionId),
                dto.catalogName,
                dto.instanceType
            ),
            // We don't want to execute query on open if it's restored from a storage or link.
            // If from storage, there may a lots of tabs to restore, and we don't want to execute them all for performance reasons.
            // If from link, the query may be dangerous or something.
            false
        )
    }

    toSerializable(): GraphQLConsoleParamsDto {
        return {
            connectionId: this.instancePointer.connection.id,
            catalogName: this.instancePointer.catalogName,
            instanceType: this.instancePointer.instanceType
        }
    }
}

/**
 * Serializable DTO for storing {@link GraphQLConsoleParams} in a storage or link.
 */
interface GraphQLConsoleParamsDto extends TabRequestComponentParamsDto {
    readonly connectionId: EvitaDBConnectionId
    readonly catalogName: string
    readonly instanceType: GraphQLInstanceType
}

/**
 * Represents injectable/storable user data of the LabEditorConsoleGraphQL component.
 */
export class GraphQLConsoleData extends SerializableTabRequestComponentData<GraphQLConsoleDataDto> implements TabRequestComponentData {
    readonly query?: string
    readonly variables?: string

    constructor(query?: string, variables?: string) {
        super()
        this.query = query
        this.variables = variables
    }

    static restoreFromSerializable(json: TabRequestComponentDataDto): GraphQLConsoleData {
        const dto: GraphQLConsoleDataDto = json as GraphQLConsoleDataDto
        return new GraphQLConsoleData(dto.query, dto.variables)
    }

    toSerializable(): GraphQLConsoleDataDto {
        return {
            query: this.query,
            variables: this.variables
        }
    }
}

/**
 * Serializable DTO for storing {@link GraphQLConsoleData} in a storage or link.
 */
interface GraphQLConsoleDataDto extends TabRequestComponentDataDto {
    readonly query?: string
    readonly variables?: string
}

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
    System = 'system',
    Data = 'data',
    Schema = 'schema'
}
