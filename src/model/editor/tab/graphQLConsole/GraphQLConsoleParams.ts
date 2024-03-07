import { LabService } from '@/services/lab.service'
import { ExecutableTabRequest } from '@/model/editor/tab/ExecutableTabRequest'
import { TabRequestComponentParams } from '@/model/editor/tab/TabRequestComponentParams'
import { TabRequestComponentParamsDto } from '@/model/editor/tab/TabRequestComponentParamsDto'
import { GraphQLConsoleParamsDto } from '@/model/editor/tab/graphQLConsole/GraphQLConsoleParamsDto'
import { GraphQLInstancePointer } from '@/model/editor/tab/graphQLConsole/GraphQLInstancePointer'

/**
 * Represents props of the LabEditorConsoleGraphQL component.
 */
export class GraphQLConsoleParams implements TabRequestComponentParams<GraphQLConsoleParamsDto>, ExecutableTabRequest {
    readonly instancePointer: GraphQLInstancePointer
    readonly executeOnOpen: boolean

    constructor(instancePointer: GraphQLInstancePointer, executeOnOpen: boolean = false) {
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
