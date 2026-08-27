import type { TabData } from '@/modules/workspace/tab/model/TabData'
import type { EvitaQLConsoleTabDataDto } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabDataDto'

/**
 * Represents injectable/storable user data of the LabEditorConsoleEvitaQL component.
 */
export class EvitaQLConsoleTabData implements TabData<EvitaQLConsoleTabDataDto> {
    readonly query?: string

    constructor(query?: string) {
        this.query = query
    }

    toSerializable(): EvitaQLConsoleTabDataDto {
        return {
            query: this.query
        }
    }
}
