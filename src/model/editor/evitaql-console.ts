import { EvitaDBConnection } from '@/model/lab'
import {
    CatalogPointer,
    ExecutableTabRequest,
    TabRequestComponentData,
    TabRequestComponentParams
} from '@/model/editor/editor'

/**
 * Points to concrete evitaDB EvitaQL instance
 */
export class EvitaQLDataPointer extends CatalogPointer {
    constructor(connection: EvitaDBConnection, catalogName: string) {
        super(connection, catalogName)
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
