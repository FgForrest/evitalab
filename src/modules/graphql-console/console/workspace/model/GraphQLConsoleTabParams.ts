import {
    GraphQLConsoleTabParamsDto
} from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabParamsDto'
import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { ExecutableTabRequest } from '@/modules/workspace/tab/model/ExecutableTabRequest'
import { GraphQLConsoleDataPointer } from '@/modules/graphql-console/console/model/GraphQLConsoleDataPointer'

/**
 * Represents props of the LabEditorConsoleGraphQL component.
 */
export class GraphQLConsoleTabParams implements TabParams<GraphQLConsoleTabParamsDto>, ExecutableTabRequest {
    readonly dataPointer: GraphQLConsoleDataPointer
    readonly executeOnOpen: boolean

    constructor(dataPointer: GraphQLConsoleDataPointer, executeOnOpen: boolean = false) {
        this.dataPointer = dataPointer
        this.executeOnOpen = executeOnOpen
    }

    toSerializable(): GraphQLConsoleTabParamsDto {
        return {
            connectionId: this.dataPointer.connection.id,
            catalogName: this.dataPointer.catalogName,
            instanceType: this.dataPointer.instanceType
        }
    }
}

