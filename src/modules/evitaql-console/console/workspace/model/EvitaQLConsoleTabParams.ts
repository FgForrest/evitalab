import { ExecutableTabRequest } from '@/modules/workspace/tab/model/ExecutableTabRequest'
import {
    EvitaQLConsoleTabParamsDto
} from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabParamsDto'
import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { EvitaQLConsoleDataPointer } from '@/modules/evitaql-console/console/model/EvitaQLConsoleDataPointer'

/**
 * Represents props of the LabEditorConsoleEvitaQL component.
 */
export class EvitaQLConsoleTabParams implements TabParams<EvitaQLConsoleTabParamsDto>, ExecutableTabRequest {
    readonly dataPointer: EvitaQLConsoleDataPointer
    readonly executeOnOpen: boolean

    constructor(dataPointer: EvitaQLConsoleDataPointer, executeOnOpen: boolean) {
        this.dataPointer = dataPointer
        this.executeOnOpen = executeOnOpen
    }

    toSerializable(): EvitaQLConsoleTabParamsDto {
        return {
            connectionId: this.dataPointer.connection.id,
            connectionName: this.dataPointer.connection.name,
            catalogName: this.dataPointer.catalogName
        }
    }
}
