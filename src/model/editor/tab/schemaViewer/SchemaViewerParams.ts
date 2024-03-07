import { LabService } from '@/services/lab.service'
import { UnexpectedError } from '@/model/lab'
import { SchemaViewerDataPointer } from '@/model/editor/tab/schemaViewer/SchemaViewerDataPointer'
import { SchemaPointer } from '@/model/editor/tab/schemaViewer/SchemaPointer'
import { CatalogSchemaPointer } from '@/model/editor/tab/schemaViewer/CatalogSchemaPointer'
import { EntitySchemaPointer } from '@/model/editor/tab/schemaViewer/EntitySchemaPointer'
import { CatalogAttributeSchemaPointer } from '@/model/editor/tab/schemaViewer/CatalogAttributeSchemaPointer'
import { EntityAttributeSchemaPointer } from '@/model/editor/tab/schemaViewer/EntityAttributeSchemaPointer'
import { ReferenceAttributeSchemaPointer } from '@/model/editor/tab/schemaViewer/ReferenceAttributeSchemaPointer'
import { AssociatedDataSchemaPointer } from '@/model/editor/tab/schemaViewer/AssociatedDataSchemaPointer'
import { ReferenceSchemaPointer } from '@/model/editor/tab/schemaViewer/ReferenceSchemaPointer'
import { TabRequestComponentParams } from '@/model/editor/tab/TabRequestComponentParams'
import { SchemaViewerParamsDto } from '@/model/editor/tab/schemaViewer/SchemaViewerParamsDto'
import { TabRequestComponentParamsDto } from '@/model/editor/tab/TabRequestComponentParamsDto'
import { SchemaPointerType } from '@/model/editor/tab/schemaViewer/SchemaPointerType'

/**
 * Represents props of the LabEditorSchemaViewer component.
 */
export class SchemaViewerParams implements TabRequestComponentParams<SchemaViewerParamsDto> {
    readonly dataPointer: SchemaViewerDataPointer

    constructor(dataPointer: SchemaViewerDataPointer) {
        this.dataPointer = dataPointer
    }

    static restoreFromSerializable(labService: LabService, json: TabRequestComponentParamsDto): SchemaViewerParams {
        const dto: SchemaViewerParamsDto = json as SchemaViewerParamsDto

        const schemaPointerType: SchemaPointerType = dto.schemaPointer.type
        const schemaPointerParams: any = dto.schemaPointer.params
        let schemaPointer: SchemaPointer
        switch (schemaPointerType) {
            case SchemaPointerType.CatalogSchema:
                schemaPointer = new CatalogSchemaPointer(schemaPointerParams.catalogName)
                break
            case SchemaPointerType.EntitySchema:
                schemaPointer = new EntitySchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.entityType)
                break
            case SchemaPointerType.CatalogAttributeSchema:
                schemaPointer = new CatalogAttributeSchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.attributeName)
                break
            case SchemaPointerType.EntityAttributeSchema:
                schemaPointer = new EntityAttributeSchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.entityType, schemaPointerParams.attributeName)
                break
            case SchemaPointerType.ReferenceAttributeSchema:
                schemaPointer = new ReferenceAttributeSchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.entityType, schemaPointerParams.referenceName, schemaPointerParams.attributeName)
                break
            case SchemaPointerType.AssociatedDataSchema:
                schemaPointer = new AssociatedDataSchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.entityType, schemaPointerParams.associatedDataName)
                break
            case SchemaPointerType.ReferenceSchema:
                schemaPointer = new ReferenceSchemaPointer(schemaPointerParams.catalogName, schemaPointerParams.entityType, schemaPointerParams.referenceName)
                break
            default:
                throw new UnexpectedError(undefined, 'Unknown schema pointer type.')
        }

        return new SchemaViewerParams(
            new SchemaViewerDataPointer(
                labService.getConnection(dto.connectionId),
                schemaPointer
            )
        )
    }

    toSerializable(): SchemaViewerParamsDto {
        let schemaPointerType: SchemaPointerType
        let schemaPointerParams: any
        const schemaPointer: SchemaPointer = this.dataPointer.schemaPointer
        if (schemaPointer instanceof CatalogSchemaPointer) {
            schemaPointerType = SchemaPointerType.CatalogSchema
            schemaPointerParams = {
                catalogName: schemaPointer.catalogName
            }
        } else if (schemaPointer instanceof EntitySchemaPointer) {
            schemaPointerType = SchemaPointerType.EntitySchema
            schemaPointerParams = {
                catalogName: schemaPointer.catalogName,
                entityType: schemaPointer.entityType
            }
        } else if (schemaPointer instanceof CatalogAttributeSchemaPointer) {
            schemaPointerType = SchemaPointerType.CatalogAttributeSchema
            schemaPointerParams = {
                catalogName: schemaPointer.catalogName,
                attributeName: schemaPointer.attributeName
            }
        } else if (schemaPointer instanceof EntityAttributeSchemaPointer) {
            schemaPointerType = SchemaPointerType.EntityAttributeSchema
            schemaPointerParams = {
                catalogName: schemaPointer.catalogName,
                entityType: schemaPointer.entityType,
                attributeName: schemaPointer.attributeName
            }
        } else if (schemaPointer instanceof ReferenceAttributeSchemaPointer) {
            schemaPointerType = SchemaPointerType.ReferenceAttributeSchema
            schemaPointerParams = {
                catalogName: schemaPointer.catalogName,
                entityType: schemaPointer.entityType,
                referenceName: schemaPointer.referenceName,
                attributeName: schemaPointer.attributeName
            }
        } else if (schemaPointer instanceof AssociatedDataSchemaPointer) {
            schemaPointerType = SchemaPointerType.AssociatedDataSchema
            schemaPointerParams = {
                catalogName: schemaPointer.catalogName,
                entityType: schemaPointer.entityType,
                associatedDataName: schemaPointer.associatedDataName
            }
        } else if (schemaPointer instanceof ReferenceSchemaPointer) {
            schemaPointerType = SchemaPointerType.ReferenceSchema
            schemaPointerParams = {
                catalogName: schemaPointer.catalogName,
                entityType: schemaPointer.entityType,
                referenceName: schemaPointer.referenceName
            }
        } else {
            throw new UnexpectedError(undefined, 'Unknown schema pointer type.')
        }

        return {
            connectionId: this.dataPointer.connection.id,
            schemaPointer: {
                type: schemaPointerType,
                params: schemaPointerParams
            }
        }
    }
}
