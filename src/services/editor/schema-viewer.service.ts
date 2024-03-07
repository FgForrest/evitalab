import { LabService } from '@/services/lab.service'
import { inject, InjectionKey } from 'vue'

import {
    AssociatedDataSchema,
    AttributeSchemaUnion,
    CatalogSchema,
    EntitySchema,
    GlobalAttributeSchema,
    ReferenceSchema
} from '@/model/evitadb'
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

