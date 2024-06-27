//todo lho
import { SerializableTabRequestComponentData, TabRequestComponentDataDto } from '@/model/editor/editor'
import { SchemaDiffViewerDataDto } from '@/model/editor/tab/schema-diff-viewer/schema-diff-viewer-data-dto'
import { EvitaDBConnectionId } from '@/model/lab'
import { SchemaDiffDataPointer } from '@/model/editor/tab/schema-diff-viewer/schema-diff-data-pointer'
import { SchemaType } from '@/model/editor/tab/schema-diff-viewer/schema-type'
import { LabService } from '@/services/lab.service'

// todo
export class SchemaDiffViewerData extends SerializableTabRequestComponentData<SchemaDiffViewerDataDto> {
    readonly compareWith?: SchemaDiffDataPointer
    readonly schemaType?: SchemaType

    constructor(compared?: SchemaDiffDataPointer, schemaType?: SchemaType) {
        super()
        this.compareWith = compared
        this.schemaType = schemaType
    }

    static restoreFromSerializable(labService: LabService, json: TabRequestComponentDataDto): SchemaDiffViewerData {
        const dto: SchemaDiffViewerDataDto = json as SchemaDiffViewerDataDto
        return new SchemaDiffViewerData(
            dto.compareWithConnectionId != undefined && dto.compareWithCatalogName != undefined
                ? new SchemaDiffDataPointer(
                    labService.getConnection(dto.compareWithConnectionId),
                    dto.compareWithCatalogName
                )
                : undefined,
            dto.schemaType
        )
    }

    toSerializable(): SchemaDiffViewerDataDto {
        return {
            compareWithConnectionId: this.compareWith?.connection.id,
            compareWithCatalogName: this.compareWith?.catalogName,
            schemaType: this.schemaType
        }
    }
}
