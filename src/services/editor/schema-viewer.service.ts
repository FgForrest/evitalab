import { LabService } from '@/services/lab.service'
import { inject, InjectionKey } from 'vue'
import {
    AssociatedDataSchemaPointer,
    CatalogAttributeSchemaPointer,
    CatalogSchemaPointer, EntityAttributeSchemaPointer,
    EntitySchemaPointer, ReferenceAttributeSchemaPointer, ReferenceSchemaPointer,
    SchemaPointer,
    SchemaViewerDataPointer
} from '@/model/editor/schema-viewer'
import {
    AssociatedDataSchema,
    AttributeSchemaUnion,
    CatalogSchema,
    EntitySchema,
    GlobalAttributeSchema,
    ReferenceSchema
} from '@/model/evitadb'
import { UnexpectedError } from '@/model/lab'

export const key: InjectionKey<SchemaViewerService> = Symbol()

/**
 * Service for handling schema viewer tab component.
 */
export class SchemaViewerService {
    private readonly labService: LabService

    constructor(labService: LabService) {
        this.labService = labService
    }

    async getSchema(dataPointer: SchemaViewerDataPointer): Promise<CatalogSchema | EntitySchema | GlobalAttributeSchema | AttributeSchemaUnion | AssociatedDataSchema | ReferenceSchema> {
        const schemaPointer: SchemaPointer = dataPointer.schemaPointer
        if (schemaPointer instanceof CatalogSchemaPointer) {
            return this.labService.getCatalogSchema(dataPointer.connection, schemaPointer.catalogName)
        } else if (schemaPointer instanceof EntitySchemaPointer) {
            return this.labService.getEntitySchema(dataPointer.connection, schemaPointer.catalogName, schemaPointer.entityType)
        } else if (schemaPointer instanceof CatalogAttributeSchemaPointer) {
            return this.labService.getCatalogAttributeSchema(
                dataPointer.connection,
                schemaPointer.catalogName,
                schemaPointer.attributeName
            )
        } else if (schemaPointer instanceof EntityAttributeSchemaPointer) {
            return this.labService.getEntityAttributeSchema(
                dataPointer.connection,
                schemaPointer.catalogName,
                schemaPointer.entityType,
                schemaPointer.attributeName
            )
        } else if (schemaPointer instanceof ReferenceAttributeSchemaPointer) {
            return this.labService.getReferenceAttributeSchema(
                dataPointer.connection,
                schemaPointer.catalogName,
                schemaPointer.entityType,
                schemaPointer.referenceName,
                schemaPointer.attributeName
            )
        } else if (schemaPointer instanceof AssociatedDataSchemaPointer) {
            return this.labService.getAssociatedDataSchema(
                dataPointer.connection,
                schemaPointer.catalogName,
                schemaPointer.entityType,
                schemaPointer.associatedDataName
            )
        } else if (schemaPointer instanceof ReferenceSchemaPointer) {
            return this.labService.getReferenceSchema(
                dataPointer.connection,
                schemaPointer.catalogName,
                schemaPointer.entityType,
                schemaPointer.referenceName
            )
        } else {
            throw new UnexpectedError(undefined, `Unsupported type of schema ${schemaPointer}`)
        }
    }
}

export const useSchemaViewerService = (): SchemaViewerService => {
    return inject(key) as SchemaViewerService
}

