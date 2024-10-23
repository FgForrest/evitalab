import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { ConnectionId } from '@/modules/connection/model/ConnectionId'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'

/**
 * Serializable DTO for storing {@link GraphQLConsoleParams} in a storage or link.
 */
export interface GraphQLConsoleTabParamsDto extends TabParamsDto {
    readonly connectionId: ConnectionId
    readonly catalogName: string
    readonly instanceType: GraphQLInstanceType
}
