import { GraphQLConsoleTabDataDto } from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabDataDto'
import { TabData } from '@/modules/workspace/tab/model/TabData'

/**
 * Represents injectable/storable user data of the LabEditorConsoleGraphQL component.
 */
export class GraphQLConsoleTabData implements TabData<GraphQLConsoleTabDataDto> {
    readonly query?: string
    readonly variables?: string

    constructor(query?: string, variables?: string) {
        this.query = query
        this.variables = variables
    }

    toSerializable(): GraphQLConsoleTabDataDto {
        return {
            query: this.query,
            variables: this.variables
        }
    }
}
