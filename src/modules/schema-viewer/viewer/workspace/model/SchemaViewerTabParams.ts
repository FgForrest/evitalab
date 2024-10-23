import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { SchemaViewerTabParamsDto } from '@/modules/schema-viewer/viewer/workspace/model/SchemaViewerTabParamsDto'
import { SchemaPointerType } from '@/modules/schema-viewer/viewer/model/SchemaPointerType'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { CatalogSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogSchemaPointer'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import { CatalogAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogAttributeSchemaPointer'
import { EntityAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/EntityAttributeSchemaPointer'
import { ReferenceAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceAttributeSchemaPointer'
import { AssociatedDataSchemaPointer } from '@/modules/schema-viewer/viewer/model/AssociatedDataSchemaPointer'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'

/**
 * Represents props of the schema viewer component.
 */
export class SchemaViewerTabParams implements TabParams<SchemaViewerTabParamsDto> {
    readonly dataPointer: SchemaViewerDataPointer

    constructor(dataPointer: SchemaViewerDataPointer) {
        this.dataPointer = dataPointer
    }

    toSerializable(): SchemaViewerTabParamsDto {
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
            throw new UnexpectedError('Unknown schema pointer type.')
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
