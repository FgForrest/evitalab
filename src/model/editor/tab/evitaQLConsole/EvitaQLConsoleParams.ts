import { LabService } from '@/services/lab.service'

import { EvitaQLDataPointer } from '@/model/editor/tab/evitaQLConsole/EvitaQLDataPointer'
import { TabRequestComponentParams } from '@/model/editor/tab/TabRequestComponentParams'
import { EvitaQLConsoleParamsDto } from '@/model/editor/tab/evitaQLConsole/EvitaQLConsoleParamsDto'
import { ExecutableTabRequest } from '@/model/editor/tab/ExecutableTabRequest'
import { TabRequestComponentParamsDto } from '@/model/editor/tab/TabRequestComponentParamsDto'

/**
 * Represents props of the LabEditorConsoleEvitaQL component.
 */
export class EvitaQLConsoleParams implements TabRequestComponentParams<EvitaQLConsoleParamsDto>, ExecutableTabRequest {
    readonly dataPointer: EvitaQLDataPointer
    readonly executeOnOpen: boolean

    constructor(dataPointer: EvitaQLDataPointer, executeOnOpen: boolean) {
        this.dataPointer = dataPointer
        this.executeOnOpen = executeOnOpen
    }

    static restoreFromSerializable(labService: LabService, json: TabRequestComponentParamsDto): EvitaQLConsoleParams {
        const dto: EvitaQLConsoleParamsDto = json as EvitaQLConsoleParamsDto
        return new EvitaQLConsoleParams(
            new EvitaQLDataPointer(
                labService.getConnection(dto.connectionId),
                dto.catalogName
            ),
            // We don't want to execute query on open if it's restored from a storage or link.
            // If from storage, there may a lots of tabs to restore, and we don't want to execute them all for performance reasons.
            // If from link, the query may be dangerous or something.
            false
        )
    }

    toSerializable(): EvitaQLConsoleParamsDto {
        return {
            connectionId: this.dataPointer.connection.id,
            catalogName: this.dataPointer.catalogName
        }
    }
}
