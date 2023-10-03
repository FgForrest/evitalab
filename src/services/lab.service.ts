import { EvitaDBConnection, EvitaDBConnectionId, UnexpectedError } from '@/model/lab'
import { inject, InjectionKey } from 'vue'
import { Store } from 'vuex'
import { State } from '@/store'
import { EvitaDBClient } from '@/services/evitadb-client'
import {
    AssociatedDataSchema,
    AttributeSchemaUnion,
    Catalog,
    CatalogSchema,
    EntitySchema,
    GlobalAttributeSchema,
    ReferenceSchema, ReferenceSchemas
} from '@/model/evitadb'

export const key: InjectionKey<LabService> = Symbol()

/**
 * Service that manages lifecycle of a whole evitaLab instance. It contains generic methods for accessing evitaDB servers
 * and so on.
 */
export class LabService {
    readonly store: Store<State>
    readonly evitaDBClient: EvitaDBClient

    constructor(store: Store<State>, evitaDBClient: EvitaDBClient) {
        this.store = store
        this.evitaDBClient = evitaDBClient
    }

    isReadOnly = (): boolean => {
        return this.store.state.lab.readOnly
    }

    getConnection = (id: EvitaDBConnectionId): EvitaDBConnection | undefined => {
        return this.store.getters['lab/getConnection'](id)
    }

    getConnections = (): EvitaDBConnection[] => {
        return this.store.getters['lab/getConnections']()
    }

    isConnectionExists = (connectionName: string): boolean => {
        return this.store.getters['lab/isConnectionExists'](connectionName)
    }

    addConnection = (connection: EvitaDBConnection): void => {
        this.store.commit('lab/addConnection', connection)
    }

    removeConnection = (connectionName: string): void => {
        this.store.commit('lab/removeConnection', connectionName)
    }

    getCatalog = async (connection: EvitaDBConnection, catalogName: string): Promise<Catalog> => {
        let catalog: Catalog | undefined = this.store.getters['lab/getCatalog'](connection.id, catalogName)
        if (catalog == undefined) {
            await this.fetchCatalogs(connection)

            catalog = this.store.getters['lab/getCatalog'](connection.id, catalogName)
            if (catalog == undefined) {
                throw new UnexpectedError(undefined, `Catalog ${catalogName} not found.`)
            }
        }
        return catalog
    }

    getCatalogs = async (connection: EvitaDBConnection): Promise<Catalog[]> => {
        let catalogs: Catalog[] | undefined = this.store.getters['lab/getCatalogs'](connection.id)
        if (catalogs == undefined) {
            catalogs = await this.fetchCatalogs(connection)
        }
        return catalogs
    }

    getCatalogSchema = async (connection: EvitaDBConnection, catalogName: string): Promise<CatalogSchema> => {
        let catalogSchema: CatalogSchema | undefined = this.store.getters['lab/getCatalogSchema'](connection.id, catalogName)
        if (catalogSchema == undefined) {
            catalogSchema = await this.fetchCatalogSchema(connection, catalogName)
        }
        return catalogSchema
    }

    getEntitySchema = async (connection: EvitaDBConnection, catalogName: string, entityType: string): Promise<EntitySchema> => {
        let entitySchema: EntitySchema | undefined = this.store.getters['lab/getEntitySchema'](connection.id, catalogName, entityType)
        if (entitySchema == undefined) {
            await this.getCatalogSchema(connection, catalogName)
            entitySchema = this.store.getters['lab/getEntitySchema'](connection.id, catalogName, entityType)
            if (entitySchema == undefined) {
                throw new UnexpectedError(connection, `Entity ${entityType} not found.`)
            }
        }
        return entitySchema
    }

    getCatalogAttributeSchema = async (connection: EvitaDBConnection, catalogName: string, attributeName: string): Promise<GlobalAttributeSchema> => {
        const catalogSchema: CatalogSchema = await this.getCatalogSchema(connection, catalogName)
        const attributeSchema: GlobalAttributeSchema | undefined = Object.values(catalogSchema.attributes)
            .find(attribute => attribute.name === attributeName)
        if (attributeSchema == undefined) {
            throw new UnexpectedError(connection, `Attribute '${attributeName}' not found in catalog '${catalogName}'.`)
        }
        return attributeSchema
    }

    getEntityAttributeSchema = async (connection: EvitaDBConnection, catalogName: string, entityType: string, attributeName: string): Promise<AttributeSchemaUnion> => {
        const entitySchema: EntitySchema = await this.getEntitySchema(connection, catalogName, entityType)
        const attributeSchema: AttributeSchemaUnion | undefined = Object.values(entitySchema.attributes)
            .find(attribute => attribute.name === attributeName)
        if (attributeSchema == undefined) {
            throw new UnexpectedError(connection, `Attribute '${attributeName}' not found in entity '${entityType}' in catalog '${catalogName}'.`)
        }
        return attributeSchema
    }

    getReferenceAttributeSchema = async (connection: EvitaDBConnection,
                                         catalogName: string,
                                         entityType: string,
                                         referenceName: string,
                                         attributeName: string): Promise<AttributeSchemaUnion> => {
        const referenceSchema: ReferenceSchema = await this.getReferenceSchema(connection, catalogName, entityType, referenceName)
        const attributeSchema: AttributeSchemaUnion | undefined = Object.values(referenceSchema.attributes)
            .find(attribute => attribute.name === attributeName)
        if (attributeSchema == undefined) {
            throw new UnexpectedError(connection, `Attribute '${attributeName}' not found in reference '${referenceName}' in entity '${entityType}' in catalog '${catalogName}'.`)
        }
        return attributeSchema
    }

    getAttributeSchemaFlags = (schema: AttributeSchemaUnion): string[] => {
        const flags: string[] = []
        const globalAttribute = 'uniqueGlobally' in schema
        if (globalAttribute && (schema as GlobalAttributeSchema).uniqueGlobally) {
            flags.push('unique globally')
        } else if (schema.unique) {
            flags.push('unique')
        }
        if (schema.unique || schema.filterable) flags.push('filterable')
        if (schema.sortable) flags.push('sortable')
        if (schema.localized) flags.push('localized')
        if (schema.nullable) flags.push('nullable')
        return flags
    }

    getAssociatedDataSchema = async (connection: EvitaDBConnection, catalogName: string, entityType: string, associatedDataName: string): Promise<AssociatedDataSchema> => {
        const entitySchema: EntitySchema = await this.getEntitySchema(connection, catalogName, entityType)
        const associatedData: AssociatedDataSchema | undefined = Object.values(entitySchema.associatedData)
            .find(associatedData => associatedData.name === associatedDataName)
        if (associatedData == undefined) {
            throw new UnexpectedError(connection, `Associated data '${associatedDataName}' not found in entity '${entityType}' in catalog '${catalogName}'.`)
        }
        return associatedData
    }

    getAssociatedDataSchemaFlags = (schema: AssociatedDataSchema): string[] => {
        const flags: string[] = []
        if (schema.localized) flags.push('localized')
        if (schema.nullable) flags.push('nullable')
        return flags
    }

    getReferenceSchema = async (connection: EvitaDBConnection, catalogName: string, entityType: string, referenceName: string): Promise<ReferenceSchema> => {
        const entitySchema: EntitySchema = await this.getEntitySchema(connection, catalogName, entityType)
        const referenceSchema: ReferenceSchema | undefined = Object.values(entitySchema.references)
            .find(reference => reference.name === referenceName)
        if (referenceSchema == undefined) {
            throw new UnexpectedError(connection, `Reference '${referenceName}' not found in entity '${entityType}' in catalog '${catalogName}'.`)
        }
        return referenceSchema
    }

    getReferenceSchemaFlags = (schema: ReferenceSchema): string[] => {
        const flags: string[] = []
        if (!schema.referencedEntityTypeManaged) flags.push('external')
        if (schema.indexed) flags.push('indexed')
        if (schema.faceted) flags.push('faceted')
        return flags
    }

    private async fetchCatalogs(connection: EvitaDBConnection): Promise<Catalog[]> {
        const fetchedCatalogs: Catalog[] = await this.evitaDBClient.getCatalogs(connection)

        this.store.commit(
            'lab/putCatalogs',
            {
                connectionId: connection.id,
                catalogs: fetchedCatalogs
            }
        )

        return fetchedCatalogs
    }

    private async fetchCatalogSchema(connection: EvitaDBConnection, catalogName: string): Promise<CatalogSchema> {
        const catalog: Catalog = await this.getCatalog(connection, catalogName)

        const fetchedCatalogSchema: CatalogSchema = await this.evitaDBClient.getCatalogSchema(connection, catalog.nameVariants.kebabCase)

        this.store.commit(
            'lab/putCatalogSchema',
            {
                connectionId: connection.id,
                catalogSchema: fetchedCatalogSchema
            }
        )

        return fetchedCatalogSchema
    }
}

export const useLabService = (): LabService => {
    return inject(key) as LabService
}
