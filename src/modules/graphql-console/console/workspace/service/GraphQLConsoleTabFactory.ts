import { GraphQLConsoleTabParams } from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabParams'
import { Connection } from '@/modules/connection/model/Connection'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { GraphQLConsoleTabData } from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabData'
import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import {
    GraphQLConsoleTabDefinition
} from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabDefinition'
import { InjectionKey } from 'vue'
import { GraphQLConsoleDataPointer } from '@/modules/graphql-console/console/model/GraphQLConsoleDataPointer'
import {
    GraphQLConsoleTabParamsDto
} from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabParamsDto'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { GraphQLConsoleTabDataDto } from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabDataDto'
import { mandatoryInject } from '@/utils/reactivity'

export const graphQLConsoleTabFactoryInjectionKey: InjectionKey<GraphQLConsoleTabFactory> = Symbol('graphQLConsoleTabFactory')

/**
 * Factory for creating GraphQL console tab definitions.
 */
export class GraphQLConsoleTabFactory {

    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    /**
     * Creates new tab definition
     */
    createNew(connection: Connection,
              catalogName: string,
              instanceType: GraphQLInstanceType,
              initialData: GraphQLConsoleTabData | undefined = undefined,
              executeOnOpen: boolean = false): GraphQLConsoleTabDefinition {
        return new GraphQLConsoleTabDefinition(
            this.constructTitle(connection, catalogName, instanceType),
            this.createNewTabParams(connection, catalogName, instanceType, executeOnOpen),
            initialData ? initialData : new GraphQLConsoleTabData()
        )
    }

    /**
     * Creates new tab definition from serialized representation.
     */
    restoreFromJson(paramsJson: TabParamsDto, dataJson?: TabDataDto): GraphQLConsoleTabDefinition {
        const params: GraphQLConsoleTabParams = this.restoreTabParamsFromSerializable(paramsJson)
        const data: GraphQLConsoleTabData = this.restoreTabDataFromSerializable(dataJson)

        return new GraphQLConsoleTabDefinition(
            this.constructTitle(
                params.dataPointer.connection,
                params.dataPointer.catalogName,
                params.dataPointer.instanceType
            ),
            params,
            data
        )
    }

    private constructTitle(connection: Connection, catalogName: string, instanceType: GraphQLInstanceType): string {
        return (instanceType === GraphQLInstanceType.System ? instanceType : `${catalogName} - ${instanceType}`) + ` [${connection.name}]`
    }

    /**
     * Creates new tab params
     */
    private createNewTabParams(connection: Connection, catalogName: string, instanceType: GraphQLInstanceType, executeOnOpen: boolean): GraphQLConsoleTabParams {
        return new GraphQLConsoleTabParams(
            new GraphQLConsoleDataPointer(
                connection,
                catalogName,
                instanceType
            ),
            executeOnOpen
        )
    }

    /**
     * Creates new tab params from serialized representation.
     */
    private restoreTabParamsFromSerializable(json: TabParamsDto): GraphQLConsoleTabParams {
        const dto: GraphQLConsoleTabParamsDto = json as GraphQLConsoleTabParamsDto
        return new GraphQLConsoleTabParams(
            new GraphQLConsoleDataPointer(
                this.connectionService.getConnection(dto.connectionId),
                dto.catalogName,
                dto.instanceType
            ),
            // We don't want to execute query on open if it's restored from a storage or link.
            // If from storage, there may a lots of tabs to restore, and we don't want to execute them all for performance reasons.
            // If from link, the query may be dangerous or something.
            false
        )
    }

    /**
     * Creates new tab params from serialized representation.
     */
    private restoreTabDataFromSerializable(json?: TabDataDto): GraphQLConsoleTabData {
        if (json == undefined) {
            return new GraphQLConsoleTabData()
        }
        const dto: GraphQLConsoleTabDataDto = json as GraphQLConsoleTabDataDto
        return new GraphQLConsoleTabData(dto.query, dto.variables)
    }
}

export const useGraphQLConsoleTabFactory = (): GraphQLConsoleTabFactory => {
    return mandatoryInject(graphQLConsoleTabFactoryInjectionKey) as GraphQLConsoleTabFactory
}
