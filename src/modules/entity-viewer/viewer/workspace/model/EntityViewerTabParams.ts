import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { EntityViewerTabParamsDto } from '@/modules/entity-viewer/viewer/workspace/model/EntityViewerTabParamsDto'
import { ExecutableTabRequest } from '@/modules/workspace/tab/model/ExecutableTabRequest'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'

/**
 * Represents props of the LabEditorDataGrid component.
 */
export class EntityViewerTabParams implements TabParams<EntityViewerTabParamsDto>, ExecutableTabRequest {
    readonly dataPointer: EntityViewerDataPointer
    readonly executeOnOpen: boolean

    constructor(dataPointer: EntityViewerDataPointer, executeOnOpen: boolean = false) {
        this.dataPointer = dataPointer
        this.executeOnOpen = executeOnOpen
    }

    toSerializable(): EntityViewerTabParamsDto {
        return {
            connectionId: this.dataPointer.connection.id,
            catalogName: this.dataPointer.catalogName,
            entityType: this.dataPointer.entityType
        }
    }
}
