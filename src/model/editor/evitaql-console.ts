import { EvitaDBConnection } from '@/model/lab'
import { ExecutableTabRequest, TabRequestComponentData, TabRequestComponentParams } from '@/model/editor/editor'

/**
 * Points to concrete evitaDB EvitaQL instance
 */
export class EvitaQLDataPointer {
    readonly connection: EvitaDBConnection
    readonly catalogName: string

    constructor(connection: EvitaDBConnection, catalogName: string) {
        this.connection = connection
        this.catalogName = catalogName
    }

}

/**
 * Represents props of the LabEditorConsoleEvitaQL component.
 */
export interface EvitaQLConsoleParams extends TabRequestComponentParams, ExecutableTabRequest {
    readonly dataPointer: EvitaQLDataPointer
}

/**
 * Represents injectable/storable user data of the LabEditorConsoleEvitaQL component.
 */
export interface EvitaQLConsoleData extends TabRequestComponentData {
    readonly query?: string
    readonly variables?: string
}
