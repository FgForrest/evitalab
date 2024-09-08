import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { ExecutableTabRequest } from '@/modules/workspace/tab/model/ExecutableTabRequest'
import { RestConsoleTabParamsDto } from '@/modules/rest-console/console/workspace/model/RestConsoleTabParamsDto'
import { RestConsoleDataPointer } from '@/modules/rest-console/console/model/RestConsoleDataPointer'

/**
 * Represents props of the LabEditorConsoleGraphQL component.
 */
export class RestConsoleTabParams implements TabParams<RestConsoleTabParamsDto>, ExecutableTabRequest {
    readonly dataPointer: RestConsoleDataPointer
    readonly executeOnOpen: boolean

    constructor(dataPointer: RestConsoleDataPointer, executeOnOpen: boolean = false) {
        this.dataPointer = dataPointer
        this.executeOnOpen = executeOnOpen
    }

    toSerializable(): RestConsoleTabParamsDto {
        return {
            connectionId: this.dataPointer.connection.id,
            catalogName: this.dataPointer.catalogName
        }
    }
}

