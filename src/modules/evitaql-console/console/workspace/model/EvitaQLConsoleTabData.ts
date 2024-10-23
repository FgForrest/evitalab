import { TabData } from '@/modules/workspace/tab/model/TabData'
import { EvitaQLConsoleTabDataDto } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabDataDto'

/**
 * Represents injectable/storable user data of the LabEditorConsoleEvitaQL component.
 */
export class EvitaQLConsoleTabData implements TabData<EvitaQLConsoleTabDataDto> {
    readonly query?: string
    readonly variables?: string

    constructor(query?: string, variables?: string) {
        this.query = query
        this.variables = variables
    }

    toSerializable(): EvitaQLConsoleTabDataDto {
        return {
            query: this.query,
            variables: this.variables
        }
    }
}
