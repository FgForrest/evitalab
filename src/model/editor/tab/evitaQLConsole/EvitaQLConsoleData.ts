import { EvitaQLConsoleDataDto } from '@/model/editor/tab/evitaQLConsole/EvitaQLConsoleDataDto'
import { TabRequestComponentData } from '@/model/editor/tab/TabRequestComponentData'
import { TabRequestComponentDataDto } from '@/model/editor/tab/TabRequestComponentDataDto'

/**
 * Represents injectable/storable user data of the LabEditorConsoleEvitaQL component.
 */
export class EvitaQLConsoleData implements TabRequestComponentData<EvitaQLConsoleDataDto> {
    readonly query?: string
    readonly variables?: string

    constructor(query?: string, variables?: string) {
        this.query = query
        this.variables = variables
    }

    static restoreFromSerializable(json: TabRequestComponentDataDto): EvitaQLConsoleData {
        const dto: EvitaQLConsoleDataDto = json as EvitaQLConsoleDataDto
        return new EvitaQLConsoleData(dto.query, dto.variables)
    }

    toSerializable(): EvitaQLConsoleDataDto {
        return {
            query: this.query,
            variables: this.variables
        }
    }
}
