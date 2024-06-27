import {
    ExecutableTabRequest,
    SerializableTabRequestComponentParams,
    TabRequestComponentParamsDto
} from '@/model/editor/editor'
import { SchemaDiffViewerParamsDto } from '@/model/editor/tab/schema-diff-viewer/schema-diff-viewer-params-dto'
import { LabService } from '@/services/lab.service'
import { SchemaDiffDataPointer } from '@/model/editor/tab/schema-diff-viewer/schema-diff-data-pointer'

// todo docs
export class SchemaDiffViewerParams extends SerializableTabRequestComponentParams<SchemaDiffViewerParamsDto> implements ExecutableTabRequest{
    readonly dataPointer: SchemaDiffDataPointer
    readonly executeOnOpen: boolean

    constructor(dataPointer: SchemaDiffDataPointer, executeOnOpen: boolean = false) {
        super()
        this.dataPointer = dataPointer
        this.executeOnOpen = executeOnOpen
    }

    static restoreFromSerializable(labService: LabService, json: TabRequestComponentParamsDto): SchemaDiffViewerParams {
        const dto: SchemaDiffViewerParamsDto = json as SchemaDiffViewerParamsDto
        return new SchemaDiffViewerParams(
            new SchemaDiffDataPointer(
                labService.getConnection(dto.connectionId),
                dto.catalogName
            ),
            // We don't want to execute query on open if it's restored from a storage or link.
            // If from storage, there may a lots of tabs to restore, and we don't want to execute them all for performance reasons.
            // If from link, the query may be dangerous or something.
            false
        )
    }

    toSerializable(): SchemaDiffViewerParamsDto {
        return {
            connectionId: this.dataPointer.connection.id,
            catalogName: this.dataPointer.catalogName
        }
    }
}
