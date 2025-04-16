import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { TabParamsDtoWithConnection } from '@/modules/workspace/tab/model/TabParamsDtoWithConnection'

/**
 * Serializable DTO for storing {@link GraphQLConsoleTabParams} in a storage or link.
 */
export interface GraphQLConsoleTabParamsDto extends TabParamsDtoWithConnection {
    readonly catalogName: string
    readonly instanceType: GraphQLInstanceType
}
