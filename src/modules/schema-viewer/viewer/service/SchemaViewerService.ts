import { SchemaViewerDataPointer } from '@/modules/schema-viewer/viewer/model/SchemaViewerDataPointer'
import type { SchemaPointer } from '@/modules/schema-viewer/viewer/model/SchemaPointer'
import { CatalogSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogSchemaPointer'
import { EntitySchemaPointer } from '@/modules/schema-viewer/viewer/model/EntitySchemaPointer'
import { CatalogAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/CatalogAttributeSchemaPointer'
import { EntityAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/EntityAttributeSchemaPointer'
import { ReferenceAttributeSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceAttributeSchemaPointer'
import { AssociatedDataSchemaPointer } from '@/modules/schema-viewer/viewer/model/AssociatedDataSchemaPointer'
import { ReferenceSchemaPointer } from '@/modules/schema-viewer/viewer/model/ReferenceSchemaPointer'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { AssociatedDataSchema } from '@/modules/database-driver/request-response/schema/AssociatedDataSchema'
import { GlobalAttributeSchema } from '@/modules/database-driver/request-response/schema/GlobalAttributeSchema'
import { EntityAttributeSchema } from '@/modules/database-driver/request-response/schema/EntityAttributeSchema'
import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { ReflectedReferenceSchema } from '@/modules/database-driver/request-response/schema/ReflectedReferenceSchema.ts'
import {
    SortableAttributeCompoundSchemaPointer
} from '@/modules/schema-viewer/viewer/model/SortableAttributeCompoundSchemaPointer.ts'
import {
    SortableAttributeCompoundSchema
} from '@/modules/database-driver/request-response/schema/SortableAttributeCompoundSchema.ts'

export const schemaViewerServiceInjectionKey: InjectionKey<SchemaViewerService> = Symbol('schemaViewerService')

/**
 * Service for handling schema viewer tab component.
 */
export class SchemaViewerService {
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async getSchema(dataPointer: SchemaViewerDataPointer): Promise<CatalogSchema | EntitySchema | AttributeSchema | AssociatedDataSchema | ReferenceSchema | SortableAttributeCompoundSchema> {
        const schemaPointer: SchemaPointer = dataPointer.schemaPointer

        if (schemaPointer instanceof CatalogSchemaPointer) {
            return this.getCatalogSchemaFromPointer(schemaPointer)
        } else if (schemaPointer instanceof EntitySchemaPointer) {
            return this.getEntitySchemaFromPointer(schemaPointer)
        } else if (schemaPointer instanceof CatalogAttributeSchemaPointer) {
            return this.getGlobalAttributeSchemaPointer(schemaPointer)
        } else if (schemaPointer instanceof EntityAttributeSchemaPointer) {
            return this.getEntityAttributeSchemaPointer(schemaPointer)
        } else if (schemaPointer instanceof ReferenceAttributeSchemaPointer) {
            return this.getReferenceAttributeSchemaPointer(schemaPointer)
        } else if (schemaPointer instanceof AssociatedDataSchemaPointer) {
            return this.getAssociatedDataSchemaPointer(schemaPointer)
        } else if (schemaPointer instanceof ReferenceSchemaPointer) {
            return this.getReferenceSchemaPointer(schemaPointer)
        } else if (schemaPointer instanceof SortableAttributeCompoundSchemaPointer) {
            return this.getSortableCompoundSchemaFromPointer(schemaPointer)
        } else {
            throw new UnexpectedError(`Unsupported type of schema ${schemaPointer}`)
        }
    }

    registerSchemaChangeCallback(
        dataPointer: SchemaViewerDataPointer,
        callback: () => Promise<void>
    ): string {
        const schemaPointer: SchemaPointer = dataPointer.schemaPointer
        if (
            schemaPointer instanceof CatalogSchemaPointer ||
            schemaPointer instanceof CatalogAttributeSchemaPointer
        ) {
            return this.evitaClient.registerCatalogSchemaChangedCallback(schemaPointer.catalogName, callback)
        } else if (
            schemaPointer instanceof EntitySchemaPointer ||
            schemaPointer instanceof EntityAttributeSchemaPointer ||
            schemaPointer instanceof AssociatedDataSchemaPointer ||
            schemaPointer instanceof ReferenceSchemaPointer ||
            schemaPointer instanceof ReferenceAttributeSchemaPointer ||
            schemaPointer instanceof SortableAttributeCompoundSchemaPointer
        ) {
            return this.evitaClient.registerEntitySchemaChangedCallback(
                schemaPointer.catalogName,
                schemaPointer.entityType,
                callback
            )
        } else {
            throw new UnexpectedError(`Unsupported type of schema ${schemaPointer}`)
        }
    }

    unregisterSchemaChangeCallback(
        dataPointer: SchemaViewerDataPointer,
        id: string
    ): void {
        const schemaPointer: SchemaPointer = dataPointer.schemaPointer
        if (
            schemaPointer instanceof CatalogSchemaPointer ||
            schemaPointer instanceof CatalogAttributeSchemaPointer
        ) {
            this.evitaClient.unregisterCatalogSchemaChangedCallback(schemaPointer.catalogName, id)
        } else if (
            schemaPointer instanceof EntitySchemaPointer ||
            schemaPointer instanceof EntityAttributeSchemaPointer ||
            schemaPointer instanceof AssociatedDataSchemaPointer ||
            schemaPointer instanceof ReferenceSchemaPointer ||
            schemaPointer instanceof ReferenceAttributeSchemaPointer ||
            schemaPointer instanceof SortableAttributeCompoundSchemaPointer
        ) {
            this.evitaClient.unregisterEntitySchemaChangedCallback(
                schemaPointer.catalogName,
                schemaPointer.entityType,
                id
            )
        } else {
            throw new UnexpectedError(`Unsupported type of schema ${schemaPointer}`)
        }
    }

    async clearSchemaCache(dataPointer: SchemaViewerDataPointer): Promise<void> {
        const schemaPointer: SchemaPointer = dataPointer.schemaPointer
        if (
            schemaPointer instanceof CatalogSchemaPointer ||
            schemaPointer instanceof CatalogAttributeSchemaPointer
        ) {
            await this.evitaClient.clearSchemaCache(schemaPointer.catalogName)
        } else if (
            schemaPointer instanceof EntitySchemaPointer ||
            schemaPointer instanceof EntityAttributeSchemaPointer ||
            schemaPointer instanceof AssociatedDataSchemaPointer ||
            schemaPointer instanceof ReferenceSchemaPointer ||
            schemaPointer instanceof ReferenceAttributeSchemaPointer ||
            schemaPointer instanceof SortableAttributeCompoundSchemaPointer
        ) {
            await this.evitaClient.clearSchemaCache(schemaPointer.catalogName, schemaPointer.entityType)
        } else {
            throw new UnexpectedError(`Unsupported type of schema ${schemaPointer}`)
        }
    }

    async getCatalog(catalogName: string): Promise<CatalogStatistics> {
        return await this.evitaClient.management.getCatalogStatisticsForCatalog(catalogName)
    }

    async getEntitySchema(catalogName: string, entityType: string): Promise<EntitySchema> {
        return await this.evitaClient.queryCatalog(
            catalogName,
            session => session.getEntitySchemaOrThrowException(entityType)
        )
    }

    async getReflectedSchema(catalogName: string, name: string): Promise<ReflectedReferenceSchema[]> {
        const reflectedReferenceSchemas: ReflectedReferenceSchema[] = []
        const catalogSchema = await this.evitaClient.queryCatalog(catalogName, session => session.getCatalogSchema())
        const entitySchemas = await catalogSchema.entitySchemas()


        for (const entity of entitySchemas) {
            for (const reference of entity[1].references) {
                if (reference[1] instanceof ReflectedReferenceSchema) {
                    if (reference[1].reflectedReferenceName === name) {
                        reference[1].reflectedType = entity[1].name
                        reflectedReferenceSchemas.push(reference[1])
                    }
                }
            }
        }

        return reflectedReferenceSchemas
    }

    private async getCatalogSchemaFromPointer(schemaPointer: CatalogSchemaPointer): Promise<CatalogSchema> {
        return await this.evitaClient.queryCatalog(
            schemaPointer.catalogName,
            session => session.getCatalogSchema()
        )
    }

    private async getSortableCompoundSchemaFromPointer(schemaPointer: SortableAttributeCompoundSchemaPointer): Promise<SortableAttributeCompoundSchema> {
        const data = (await this.getEntitySchemaFromPointer(schemaPointer
        )).sortableAttributeCompounds
        const item = data.get(schemaPointer.sortableAttributeCompoundName)

        if (item == undefined) {
            throw new UnexpectedError(`Compound schema ${schemaPointer.sortableAttributeCompoundName} not found in catalog ${schemaPointer.catalogName}.`)
        }
        return item
    }

    private async getEntitySchemaFromPointer(schemaPointer: EntitySchemaPointer): Promise<EntitySchema> {
        return await this.evitaClient.queryCatalog(
            schemaPointer.catalogName,
            session => session.getEntitySchemaOrThrowException(schemaPointer.entityType)
        )
    }

    private async getGlobalAttributeSchemaPointer(schemaPointer: CatalogAttributeSchemaPointer): Promise<GlobalAttributeSchema> {
        const attributeSchema: GlobalAttributeSchema | undefined = (await this.getCatalogSchemaFromPointer(schemaPointer))
            .attributes
            .get(schemaPointer.attributeName)
        if (attributeSchema == undefined) {
            throw new UnexpectedError(`Attribute '${schemaPointer.attributeName}' not found in catalog '${schemaPointer.catalogName}'.`)
        }
        return attributeSchema
    }

    private async getEntityAttributeSchemaPointer(schemaPointer: EntityAttributeSchemaPointer): Promise<EntityAttributeSchema> {
        const attributeSchema: EntityAttributeSchema | undefined = (await this.getEntitySchemaFromPointer(schemaPointer))
            .attributes
            .get(schemaPointer.attributeName)
        if (attributeSchema == undefined) {
            throw new UnexpectedError(`Attribute '${schemaPointer.attributeName}' not found in entity '${schemaPointer.entityType}' in catalog '${schemaPointer.catalogName}'.`)
        }
        return attributeSchema
    }

    private async getAssociatedDataSchemaPointer(schemaPointer: AssociatedDataSchemaPointer): Promise<AssociatedDataSchema> {
        const associatedDataSchema: AssociatedDataSchema | undefined = (await this.getEntitySchemaFromPointer(schemaPointer))
            .associatedData
            .get(schemaPointer.associatedDataName)
        if (associatedDataSchema == undefined) {
            throw new UnexpectedError(`Associated data '${schemaPointer.associatedDataName}' not found in entity '${schemaPointer.entityType}' in catalog '${schemaPointer.catalogName}'.`)
        }
        return associatedDataSchema
    }

    private async getReferenceSchemaPointer(schemaPointer: ReferenceSchemaPointer): Promise<ReferenceSchema> {
        const referenceSchema: ReferenceSchema | undefined = (await this.getEntitySchemaFromPointer(schemaPointer))
            .references
            .get(schemaPointer.referenceName)
        if (referenceSchema == undefined) {
            throw new UnexpectedError(`Reference '${schemaPointer.referenceName}' not found in entity '${schemaPointer.entityType}' in catalog '${schemaPointer.catalogName}'.`)
        }
        return referenceSchema
    }

    private async getReferenceAttributeSchemaPointer(schemaPointer: ReferenceAttributeSchemaPointer): Promise<AttributeSchema> {
        const attributeSchema: AttributeSchema | undefined = (await this.getReferenceSchemaPointer(schemaPointer))
            .attributes
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
