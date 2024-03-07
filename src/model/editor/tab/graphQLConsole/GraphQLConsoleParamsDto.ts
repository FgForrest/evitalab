import { EvitaDBConnectionId } from '@/model/lab'
import { TabRequestComponentParamsDto } from '@/model/editor/tab/TabRequestComponentParamsDto'
import { GraphQLInstanceType } from '@/model/editor/tab/graphQLConsole/GraphQLInstanceType'

/**
 * Serializable DTO for storing {@link GraphQLConsoleParams} in a storage or link.
 */
export interface GraphQLConsoleParamsDto extends TabRequestComponentParamsDto {
    readonly connectionId: EvitaDBConnectionId
    readonly catalogName: string
    readonly instanceType: GraphQLInstanceType
}
