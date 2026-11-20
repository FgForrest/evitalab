import type { TabParams } from '@/modules/workspace/tab/model/TabParams'
import type { ExecutableTabRequest } from '@/modules/workspace/tab/model/ExecutableTabRequest'
import { RestConsoleDataPointer } from '@/modules/rest-console/console/model/RestConsoleDataPointer'
import type { RestConsoleTabParamsDto } from '@/modules/rest-console/console/workspace/model/RestConsoleTabParamsDto'

/**
 * Identity of a REST console tab: which REST API instance it talks to.
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
            connectionName: this.dataPointer.connection.name,
            catalogName: this.dataPointer.catalogName,
            instanceType: this.dataPointer.instanceType
        }
    }
}
