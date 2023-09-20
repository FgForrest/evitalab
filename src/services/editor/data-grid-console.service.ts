import { inject, InjectionKey } from 'vue'
import {
    DataGridDataPointer,
    EntityPropertyKey,
    EntityPropertyType,
    QueryResult,
    StaticEntityProperties
} from '@/model/editor/data-grid'
import { QueryLanguage, UnexpectedError } from '@/model/lab'
import { QueryExecutor } from '@/services/editor/data-grid-console/query-executor'
import { QueryBuilder } from '@/services/editor/data-grid-console/query-builder'
import { EvitaQLQueryBuilder } from '@/services/editor/data-grid-console/evitaql-query-builder'
import { EvitaQLQueryExecutor } from '@/services/editor/data-grid-console/evitaql-query-executor'
import { LabService } from '@/services/lab.service'
import { GraphQLQueryBuilder } from '@/services/editor/data-grid-console/graphql-query-builder'
import { GraphQLQueryExecutor } from '@/services/editor/data-grid-console/graphql-query-executor'
import { EvitaDBClient } from '@/services/evitadb-client'
import { AttributeSchemaUnion, EntitySchema } from '@/model/evitadb'
import { GraphQLClient } from '@/services/graphql-client'

export const key: InjectionKey<DataGridConsoleService> = Symbol()

/**
 * Service for running the data grid console component.
 */
export class DataGridConsoleService {
    readonly labService: LabService
    readonly queryBuilders: Map<QueryLanguage, QueryBuilder> = new Map<QueryLanguage, QueryBuilder>()
    readonly queryExecutors: Map<QueryLanguage, QueryExecutor> = new Map<QueryLanguage, QueryExecutor>()

    constructor(labService: LabService, evitaDBClient: EvitaDBClient, graphQLClient: GraphQLClient) {
        this.labService = labService

        this.queryBuilders.set(QueryLanguage.EvitaQL, new EvitaQLQueryBuilder(this.labService))
        this.queryExecutors.set(QueryLanguage.EvitaQL, new EvitaQLQueryExecutor(this.labService, evitaDBClient))

        this.queryBuilders.set(QueryLanguage.GraphQL, new GraphQLQueryBuilder(this.labService))
        this.queryExecutors.set(QueryLanguage.GraphQL, new GraphQLQueryExecutor(this.labService, graphQLClient))
    }

    /**
     * Builds query from arguments into desired language, executes it, and returns result.
     *
     * @param dataPointer points to collection where to fetch data from
     * @param language language of query, defines how query will be built and executed
     * @param filterBy filter by part of query, depends on language
     * @param orderBy order by part of query, depends on language
     * @param dataLocale locale of data in query, if undefined, only global data are returned
     * @param requiredData defines which data should be fetched from collection as entity fields
     * @param pageNumber page number of query result
     * @param pageSize page size of query result
     */
    async executeQuery(dataPointer: DataGridDataPointer,
                       language: QueryLanguage,
                       filterBy: string,
                       orderBy: string,
                       dataLocale: string | undefined,
                       requiredData: string[],
                       pageNumber: number,
                       pageSize: number): Promise<QueryResult> {
        const queryBuilder: QueryBuilder = this.getQueryBuilder(language)
        const queryExecutor: QueryExecutor = this.getQueryExecutor(language)

        const query: string = await queryBuilder.buildQuery(
            dataPointer,
            filterBy,
            orderBy,
            dataLocale === undefined || dataLocale === 'none' ? undefined : dataLocale,
            requiredData.map(property => EntityPropertyKey.fromString(property)),
            pageNumber,
            pageSize
        )
        return queryExecutor.executeQuery(dataPointer, query)
    }

    /**
     * Builds order by clause from selected grid columns.
     *
     * @param dataPointer points to collection where to fetch data from
     * @param language language of query, defines how query will be built and executed
     * @param columns columns that represents by which entity properties we want to sort
     */
    async buildOrderByFromGridColumns(dataPointer: DataGridDataPointer, language: QueryLanguage, columns: any[]): Promise<string> {
        const entitySchema: EntitySchema = await this.labService.getEntitySchema(dataPointer.connection, dataPointer.catalogName, dataPointer.entityType)
        const queryBuilder: QueryBuilder = this.getQueryBuilder(language)

        const orderBy: string[] = []
        for (const column of columns) {
            const propertyKey: EntityPropertyKey = EntityPropertyKey.fromString(column.key)
            if (propertyKey.type === EntityPropertyType.Attributes) {
                const attributeSchema: AttributeSchemaUnion | undefined = Object.values(entitySchema.attributes)
                    .find(attributeSchema => attributeSchema.nameVariants.camelCase === propertyKey.name)
                if (attributeSchema === undefined) {
                    throw new UnexpectedError(undefined, `Entity ${entitySchema.name} does not have attribute ${propertyKey.name}.`)
                }

                orderBy.push(queryBuilder.buildAttributeNaturalConstraint(attributeSchema, column.order))
            } else {
                throw new UnexpectedError(undefined, `Entity property ${column.key} is not supported to be sortable.`)
            }
        }

        return orderBy.join(', ')
    }

    /**
     * Returns a list of locales in which data are stored in given collection.
     */
    async getDataLocales(dataPointer: DataGridDataPointer): Promise<string[]> {
        const entitySchema: EntitySchema = await this.labService.getEntitySchema(dataPointer.connection, dataPointer.catalogName, dataPointer.entityType)
        return entitySchema.locales
    }

    /**
     * Builds a list of all possible entity properties for entities of given schema.
     */
    async getEntityPropertyKeys(dataPointer: DataGridDataPointer): Promise<EntityPropertyKey[]> {
        const entitySchema: EntitySchema = await this.labService.getEntitySchema(dataPointer.connection, dataPointer.catalogName, dataPointer.entityType)

        const entityProperties: EntityPropertyKey[] = []

        entityProperties.push(EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey))
        if (entitySchema.withHierarchy) {
            entityProperties.push(EntityPropertyKey.entity(StaticEntityProperties.Parent))
        }
        if (entitySchema.locales.length > 0) {
            entityProperties.push(EntityPropertyKey.entity(StaticEntityProperties.Locales))
            entityProperties.push(EntityPropertyKey.entity(StaticEntityProperties.AllLocales))
        }
        if (entitySchema.withPrice) {
            entityProperties.push(EntityPropertyKey.entity(StaticEntityProperties.PriceInnerRecordHandling))
        }
        for (const attributeSchema of Object.values(entitySchema.attributes)) {
            entityProperties.push(EntityPropertyKey.attributes(attributeSchema.nameVariants.camelCase))
        }
        for (const associatedDataSchema of Object.values(entitySchema.associatedData)) {
            entityProperties.push(EntityPropertyKey.associatedData(associatedDataSchema.nameVariants.camelCase))
        }
        for (const referenceSchema of Object.values(entitySchema.references)) {
            entityProperties.push(EntityPropertyKey.references(referenceSchema.nameVariants.camelCase))
        }

        return entityProperties
    }

    /**
     * Determines if property is sortable based on its type and potentially entity schema.
     */
    async isEntityPropertySortable(dataPointer: DataGridDataPointer, entityProperty: string): Promise<boolean> {
        const entitySchema: EntitySchema = await this.labService.getEntitySchema(dataPointer.connection, dataPointer.catalogName, dataPointer.entityType)

        const propertyKey: EntityPropertyKey = EntityPropertyKey.fromString(entityProperty)
        if (propertyKey.type !== EntityPropertyType.Attributes) {
            return false
        }

        const attributeSchema: AttributeSchemaUnion | undefined = Object.values(entitySchema.attributes)
            .find(attributeSchema => attributeSchema.nameVariants.camelCase === propertyKey.name)
        if (attributeSchema === undefined) {
            throw new UnexpectedError(undefined, `Attribute ${propertyKey.name} not found in entity schema ${entitySchema.name}.`)
        }
        return attributeSchema.sortable
    }

    private getQueryBuilder(language: QueryLanguage): QueryBuilder {
        const queryBuilder: QueryBuilder | undefined = this.queryBuilders.get(language)
        if (queryBuilder === undefined) {
            throw new UnexpectedError(undefined, `Query builder for language ${language} is not registered.`)
        }
        return queryBuilder
    }

    private getQueryExecutor(language: QueryLanguage): QueryExecutor {
        const queryExecutor: QueryExecutor | undefined = this.queryExecutors.get(language)
        if (queryExecutor === undefined) {
            throw new UnexpectedError(undefined, `Query executor for language ${language} is not registered.`)
        }
        return queryExecutor
    }
}

export const useDataGridConsoleService = (): DataGridConsoleService => {
    return inject(key) as DataGridConsoleService
}
