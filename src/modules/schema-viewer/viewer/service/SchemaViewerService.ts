import { Map as ImmutableMap } from 'immutable'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { CatalogSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogSchemaPointer'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import { CatalogAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogAttributeSchemaPointer'
import { EntityAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/EntityAttributeSchemaPointer'
import { ReferenceAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceAttributeSchemaPointer'
import { AssociatedDataSchemaPointer } from '@/modules/schema-viewer/viewer/model/AssociatedDataSchemaPointer'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { CatalogSchema } from '@/modules/connection/model/schema/CatalogSchema'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { AttributeSchema } from '@/modules/connection/model/schema/AttributeSchema'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import { AssociatedDataSchema } from '@/modules/connection/model/schema/AssociatedDataSchema'
import { GlobalAttributeSchema } from '@/modules/connection/model/schema/GlobalAttributeSchema'
import { EntityAttributeSchema } from '@/modules/connection/model/schema/EntityAttributeSchema'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { Catalog } from '@/modules/connection/model/Catalog'

const emptyGlobalAttributeSchemasMap: ImmutableMap<string, GlobalAttributeSchema> = ImmutableMap()
const emptyEntityAttributeSchemasMap: ImmutableMap<string, EntityAttributeSchema> = ImmutableMap()
const emptyAssociatedDataSchemasMap: ImmutableMap<string, AssociatedDataSchema> = ImmutableMap()
const emptyReferenceSchemasMap: ImmutableMap<string, ReferenceSchema> = ImmutableMap()

export const schemaViewerServiceInjectionKey: InjectionKey<SchemaViewerService> = Symbol('schemaViewerService')

/**
 * Service for handling schema viewer tab component.
 */
export class SchemaViewerService {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    async getSchema(dataPointer: SchemaViewerDataPointer): Promise<CatalogSchema | EntitySchema | AttributeSchema | AssociatedDataSchema | ReferenceSchema> {
        const schemaPointer: SchemaPointer = dataPointer.schemaPointer

        if (schemaPointer instanceof CatalogSchemaPointer) {
            return this.getCatalogSchema(dataPointer, schemaPointer)
        } else if (schemaPointer instanceof EntitySchemaPointer) {
            return this.getEntitySchema(dataPointer, schemaPointer)
        } else if (schemaPointer instanceof CatalogAttributeSchemaPointer) {
            return this.getGlobalAttributeSchema(dataPointer, schemaPointer)
        } else if (schemaPointer instanceof EntityAttributeSchemaPointer) {
            return this.getEntityAttributeSchema(dataPointer, schemaPointer)
        } else if (schemaPointer instanceof ReferenceAttributeSchemaPointer) {
            return this.getReferenceAttributeSchema(dataPointer, schemaPointer)
        } else if (schemaPointer instanceof AssociatedDataSchemaPointer) {
            return this.getAssociatedDataSchema(dataPointer, schemaPointer)
        } else if (schemaPointer instanceof ReferenceSchemaPointer) {
            return this.getReferenceSchema(dataPointer, schemaPointer)
        } else {
            throw new UnexpectedError(`Unsupported type of schema ${schemaPointer}`)
        }
    }

    async getCatalog(dataPointer: SchemaViewerDataPointer, 
                    catalogName: string): Promise<Catalog> {
        return await this.connectionService.getCatalog(dataPointer.connection, catalogName)
    }

    private async getCatalogSchema(dataPointer: SchemaViewerDataPointer,
                                   schemaPointer: CatalogSchemaPointer): Promise<CatalogSchema> {
        return await this.connectionService.getCatalogSchema(dataPointer.connection, schemaPointer.catalogName)
    }

    private async getEntitySchema(dataPointer: SchemaViewerDataPointer,
                                  schemaPointer: EntitySchemaPointer): Promise<EntitySchema> {
        return await this.connectionService.getEntitySchema(dataPointer.connection, schemaPointer.catalogName, schemaPointer.entityType)
    }

    private async getGlobalAttributeSchema(dataPointer: SchemaViewerDataPointer,
                                           schemaPointer: CatalogAttributeSchemaPointer): Promise<GlobalAttributeSchema> {
        const attributeSchema: GlobalAttributeSchema | undefined = (await this.getCatalogSchema(dataPointer, schemaPointer))
            .attributes
            .getOrElse(emptyGlobalAttributeSchemasMap)
            .get(schemaPointer.attributeName)
        if (attributeSchema == undefined) {
            throw new UnexpectedError(`Attribute '${schemaPointer.attributeName}' not found in catalog '${schemaPointer.catalogName}'.`)
        }
        return attributeSchema
    }

    private async getEntityAttributeSchema(dataPointer: SchemaViewerDataPointer,
                                           schemaPointer: EntityAttributeSchemaPointer): Promise<EntityAttributeSchema> {
        const attributeSchema: EntityAttributeSchema | undefined = (await this.getEntitySchema(dataPointer, schemaPointer))
            .attributes
            .getOrElse(emptyEntityAttributeSchemasMap)
            .get(schemaPointer.attributeName)
        if (attributeSchema == undefined) {
            throw new UnexpectedError(`Attribute '${schemaPointer.attributeName}' not found in entity '${schemaPointer.entityType}' in catalog '${schemaPointer.catalogName}'.`)
        }
        return attributeSchema
    }

    private async getAssociatedDataSchema(dataPointer: SchemaViewerDataPointer,
                                          schemaPointer: AssociatedDataSchemaPointer): Promise<AssociatedDataSchema> {
        const associatedDataSchema: AssociatedDataSchema | undefined = (await this.getEntitySchema(dataPointer, schemaPointer))
            .associatedData
            .getOrElse(emptyAssociatedDataSchemasMap)
            .get(schemaPointer.associatedDataName)
        if (associatedDataSchema == undefined) {
            throw new UnexpectedError(`Associated data '${schemaPointer.associatedDataName}' not found in entity '${schemaPointer.entityType}' in catalog '${schemaPointer.catalogName}'.`)
        }
        return associatedDataSchema
    }

    private async getReferenceSchema(dataPointer: SchemaViewerDataPointer,
                                     schemaPointer: ReferenceSchemaPointer): Promise<ReferenceSchema> {
        const referenceSchema: ReferenceSchema | undefined = (await this.getEntitySchema(dataPointer, schemaPointer))
            .references
            .getOrElse(emptyReferenceSchemasMap)
            .get(schemaPointer.referenceName)
        if (referenceSchema == undefined) {
            throw new UnexpectedError(`Reference '${schemaPointer.referenceName}' not found in entity '${schemaPointer.entityType}' in catalog '${schemaPointer.catalogName}'.`)
        }
        return referenceSchema
    }

    private async getReferenceAttributeSchema(dataPointer: SchemaViewerDataPointer,
                                              schemaPointer: ReferenceAttributeSchemaPointer): Promise<AttributeSchema> {
        const attributeSchema: AttributeSchema | undefined = (await this.getReferenceSchema(dataPointer, schemaPointer))
            .attributes
            .getOrElse(emptyEntityAttributeSchemasMap)
            .get(schemaPointer.attributeName)
        if (attributeSchema == undefined) {
            throw new UnexpectedError(`Attribute '${schemaPointer.attributeName}' not found in reference '${schemaPointer.referenceName}' in entity '${schemaPointer.entityType}' in catalog '${schemaPointer.catalogName}'.`)
        }
        return attributeSchema
    }
}

export const useSchemaViewerService = (): SchemaViewerService => {
    return mandatoryInject(schemaViewerServiceInjectionKey) as SchemaViewerService
}
