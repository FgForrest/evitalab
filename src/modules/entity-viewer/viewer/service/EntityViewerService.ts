import { InjectionKey } from 'vue'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import { GraphQLClient } from '@/modules/graphql-console/driver/service/GraphQLClient'
import { QueryLanguage } from '@/modules/entity-viewer/viewer/model/QueryLanguage'
import { EvitaQLQueryBuilder } from '@/modules/entity-viewer/viewer/service/EvitaQLQueryBuilder'
import { EvitaQLQueryExecutor } from '@/modules/entity-viewer/viewer/service/EvitaQLQueryExecutor'
import { GraphQLQueryBuilder } from '@/modules/entity-viewer/viewer/service/GraphQLQueryBuilder'
import { GraphQLQueryExecutor } from '@/modules/entity-viewer/viewer/service/GraphQLQueryExecutor'
import {
    EntityPropertyValueSupportedCodeLanguage
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPropertyValueSupportedCodeLanguage'
import {
    EntityPropertyValueRawFormatter
} from '@/modules/entity-viewer/viewer/service/entity-property-value-formatter/EntityPropertyValueRawFormatter'
import {
    EntityPropertyValueJsonFormatter
} from '@/modules/entity-viewer/viewer/service/entity-property-value-formatter/EntityPropertyValueJsonFormatter'
import {
    EntityPropertyValueXmlFormatter
} from '@/modules/entity-viewer/viewer/service/entity-property-value-formatter/EntityPropertyValueXmlFormatter'
import { QueryBuilder } from '@/modules/entity-viewer/viewer/service/QueryBuilder'
import { QueryExecutor } from '@/modules/entity-viewer/viewer/service/QueryExecutor'
import { EntityPropertyValueFormatter } from '@/modules/entity-viewer/viewer/service/EntityPropertyValueFormatter'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { QueryResult } from '@/modules/entity-viewer/viewer/model/QueryResult'
import { EntityPrice } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { EntityPrices } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrices'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { EntityAttributeSchema } from '@/modules/connection/model/schema/EntityAttributeSchema'
import { NamingConvention } from '@/modules/connection/model/NamingConvetion'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import { AttributeSchema } from '@/modules/connection/model/schema/AttributeSchema'
import { List as ImmutableList, Map as ImmutableMap } from 'immutable'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'
import { EvitaDBDriverResolver } from '@/modules/connection/driver/EvitaDBDriverResolver'
import { mandatoryInject } from '@/utils/reactivity'
import { Locale } from '@/modules/connection/model/data-type/Locale'

export const entityViewerServiceInjectionKey: InjectionKey<EntityViewerService> = Symbol('entityViewerService')

/**
 * Service for running the entity viewer component.
 */
export class EntityViewerService {
    private readonly connectionService: ConnectionService

    private readonly queryBuilders: Map<QueryLanguage, QueryBuilder> = new Map<QueryLanguage, QueryBuilder>()
    private readonly queryExecutors: Map<QueryLanguage, QueryExecutor> = new Map<QueryLanguage, QueryExecutor>()

    private readonly entityPropertyValueFormatters: Map<EntityPropertyValueSupportedCodeLanguage, EntityPropertyValueFormatter> = new Map<EntityPropertyValueSupportedCodeLanguage, EntityPropertyValueFormatter>()

    constructor(connectionService: ConnectionService, evitaDBDriverResolver: EvitaDBDriverResolver, graphQLClient: GraphQLClient) {
        this.connectionService = connectionService

        this.queryBuilders.set(QueryLanguage.EvitaQL, new EvitaQLQueryBuilder(this.connectionService))
        this.queryExecutors.set(QueryLanguage.EvitaQL, new EvitaQLQueryExecutor(this.connectionService, evitaDBDriverResolver))

        this.queryBuilders.set(QueryLanguage.GraphQL, new GraphQLQueryBuilder(this.connectionService))
        this.queryExecutors.set(QueryLanguage.GraphQL, new GraphQLQueryExecutor(this.connectionService, graphQLClient))

        this.entityPropertyValueFormatters.set(EntityPropertyValueSupportedCodeLanguage.Raw, new EntityPropertyValueRawFormatter())
        this.entityPropertyValueFormatters.set(EntityPropertyValueSupportedCodeLanguage.Json, new EntityPropertyValueJsonFormatter())
        this.entityPropertyValueFormatters.set(EntityPropertyValueSupportedCodeLanguage.Xml, new EntityPropertyValueXmlFormatter())
    }

    /**
     * Builds query from arguments into desired language, executes it, and returns result.
     *
     * @param dataPointer points to collection where to fetch data from
     * @param language language of query, defines how query will be built and executed
     * @param filterBy filter by part of query, depends on language
     * @param orderBy order by part of query, depends on language
     * @param dataLocale locale of data in query, if undefined, only global data are returned
     * @param priceType price type of data in query, undefined if the target collection doesn't support prices
     * @param requiredData defines which data should be fetched from collection as entity fields
     * @param pageNumber page number of query result
     * @param pageSize page size of query result
     */
    async executeQuery(dataPointer: EntityViewerDataPointer,
                       language: QueryLanguage,
                       filterBy: string,
                       orderBy: string,
                       dataLocale: string | undefined,
                       priceType: QueryPriceMode | undefined,
                       requiredData: EntityPropertyKey[],
                       pageNumber: number,
                       pageSize: number): Promise<QueryResult> {
        const queryBuilder: QueryBuilder = this.getQueryBuilder(language)
        const queryExecutor: QueryExecutor = this.getQueryExecutor(language)

        const query: string = await queryBuilder.buildQuery(
            dataPointer,
            filterBy,
            orderBy,
            dataLocale,
            priceType,
            requiredData,
            pageNumber,
            pageSize
        )
        return queryExecutor.executeQuery(dataPointer, query)
    }

    /**
     * Builds and executes a query from arguments to compute price for sale of given entity.
     *
     * @param dataPointer points to collection where to fetch data from
     * @param language language of query, defines how query will be built and executed
     * @param entityPrimaryKey primary key of entity for which we want to compute price for sale
     * @param priceLists price lists to use for price computation, order is important
     * @param currency currency to use for price computation
     */
    async computePriceForSale(dataPointer: EntityViewerDataPointer,
                              language: QueryLanguage,
                              entityPrimaryKey: number,
                              priceLists: string[],
                              currency: string): Promise<EntityPrice | undefined> {
        const queryBuilder: QueryBuilder = this.getQueryBuilder(language)
        const queryExecutor: QueryExecutor = this.getQueryExecutor(language)

        const query: string = await queryBuilder.buildQuery(
            dataPointer,
            queryBuilder.buildPriceForSaleFilterBy(entityPrimaryKey, priceLists, currency),
            '',
            undefined,
            undefined,
            [EntityPropertyKey.prices()],
            1,
            1
        )
        const result: QueryResult = await queryExecutor.executeQuery(dataPointer, query)
        if (result.totalEntitiesCount === 0) {
            return undefined
        } else if (result.totalEntitiesCount != 1) {
            throw new UnexpectedError(`Expected 1 entity with price for sale, got ${result.totalEntitiesCount} entities.`)
        }
        return (result.entities[0][EntityPropertyKey.prices().toString()] as EntityPrices | undefined)?.priceForSale
    }

    /**
     * Builds order by clause from selected grid columns.
     *
     * @param dataPointer points to collection where to fetch data from
     * @param language language of query, defines how query will be built and executed
     * @param columns columns that represents by which entity properties we want to sort
     */
    async buildOrderByFromGridColumns(dataPointer: EntityViewerDataPointer,
                                      language: QueryLanguage,
                                      columns: any[]): Promise<string> {
        const entitySchema: EntitySchema = await this.connectionService.getEntitySchema(dataPointer.connection, dataPointer.catalogName, dataPointer.entityType)
        const queryBuilder: QueryBuilder = this.getQueryBuilder(language)

        const orderBy: string[] = []
        for (const column of columns) {
            const propertyKey: EntityPropertyKey = EntityPropertyKey.fromString(column.key)
            if (propertyKey.type === EntityPropertyType.Entity && propertyKey.name === StaticEntityProperties.PrimaryKey) {
                orderBy.push(queryBuilder.buildPrimaryKeyOrderBy(column.order.toUpperCase()))
            } else if (propertyKey.type === EntityPropertyType.Attributes) {
                const attributeSchema: EntityAttributeSchema | undefined = entitySchema.attributes
                    .getIfSupported()
                    ?.find(attributeSchema => attributeSchema.nameVariants
                        .getIfSupported()
                        ?.get(NamingConvention.CamelCase) === propertyKey.name)
                if (attributeSchema == undefined) {
                    throw new UnexpectedError(`Entity ${entitySchema.name} does not have attribute ${propertyKey.name}.`)
                }

                orderBy.push(queryBuilder.buildAttributeOrderBy(attributeSchema, column.order.toUpperCase()))
            } else if (propertyKey.type === EntityPropertyType.ReferenceAttributes) {
                const referenceSchema: ReferenceSchema | undefined = entitySchema.references
                    .getIfSupported()
                    ?.find(referenceSchema => referenceSchema.nameVariants
                        .getIfSupported()
                        ?.get(NamingConvention.CamelCase) === propertyKey.parentName)
                if (referenceSchema == undefined) {
                    throw new UnexpectedError(`Entity ${entitySchema.name} does not have reference ${propertyKey.parentName}.`)
                }
                const attributeSchema: AttributeSchema | undefined = referenceSchema.attributes
                    .getIfSupported()
                    ?.find(attributeSchema => attributeSchema.nameVariants
                        .getIfSupported()
                        ?.get(NamingConvention.CamelCase) === propertyKey.name)
                if (attributeSchema == undefined) {
                    throw new UnexpectedError(`Reference ${referenceSchema.name} does not have attribute ${propertyKey.name}.`)
                }

                orderBy.push(queryBuilder.buildReferenceAttributeOrderBy(referenceSchema, attributeSchema, column.order.toUpperCase()))
            } else {
                throw new UnexpectedError(`Entity property ${column.key} is not supported to be sortable.`)
            }
        }

        return orderBy.join(', ')
    }

    /**
     * Build filter by clause to find parent entities by their primary key in the same collection as child entity.
     *
     * @param language language of query, defines how query will be built and executed
     * @param parentPrimaryKey primary key of parent entity
     */
    buildParentEntityFilterBy(language: QueryLanguage, parentPrimaryKey: number): string {
        return this.getQueryBuilder(language).buildParentEntityFilterBy(parentPrimaryKey)
    }

    /**
     * Builds filter by clause to find referenced entities by their primary keys in the same collection as successor entity.
     *
     * @param language language of query, defines how query will be built and executed
     * @param predecessorPrimaryKey primary key of predecessor entity
     */
    buildPredecessorEntityFilterBy(language: QueryLanguage, predecessorPrimaryKey: number): string {
        return this.getQueryBuilder(language).buildPredecessorEntityFilterBy(predecessorPrimaryKey)
    }

    /**
     * Builds filter by clause to find referenced entities by their primary keys in a referenced collection.
     *
     * @param language language of query, defines how query will be built and executed
     * @param referencedPrimaryKeys primary keys of referenced entities
     */
    buildReferencedEntityFilterBy(language: QueryLanguage, referencedPrimaryKeys: number[]): string {
        return this.getQueryBuilder(language).buildReferencedEntityFilterBy(referencedPrimaryKeys)
    }

    /**
     * Returns a list of locales in which data are stored in given collection.
     */
    async getDataLocales(dataPointer: EntityViewerDataPointer): Promise<ImmutableList<Locale>> {
        const entitySchema: EntitySchema = await this.connectionService.getEntitySchema(
            dataPointer.connection,
            dataPointer.catalogName,
            dataPointer.entityType
        )
        return entitySchema.locales.getOrElseGet(() => ImmutableList())
    }

    async supportsPrices(dataPointer: EntityViewerDataPointer): Promise<boolean> {
        const entitySchema: EntitySchema = await this.connectionService.getEntitySchema(
            dataPointer.connection,
            dataPointer.catalogName,
            dataPointer.entityType
        )
        return entitySchema.withPrice.getOrElse(false)
    }

    /**
     * Builds a list of all possible entity properties for entities of given schema.
     */
    async getEntityPropertyDescriptors(dataPointer: EntityViewerDataPointer): Promise<EntityPropertyDescriptor[]> {
        const entitySchema: EntitySchema = await this.connectionService.getEntitySchema(
            dataPointer.connection,
            dataPointer.catalogName,
            dataPointer.entityType
        )
        const descriptors: EntityPropertyDescriptor[] = []
        // todo lho i18n
        descriptors.push(new EntityPropertyDescriptor(
            EntityPropertyType.Entity,
            EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey),
            'Primary key',
            'Primary key',
            undefined,
            undefined,
            ImmutableList()
        ))
        descriptors.push(new EntityPropertyDescriptor(
            EntityPropertyType.Entity,
            EntityPropertyKey.entity(StaticEntityProperties.Version),
            'Version',
            'Version',
            undefined,
            undefined,
            ImmutableList()
        ))
        if (entitySchema.withHierarchy.getOrElse(false)) {
            descriptors.push(new EntityPropertyDescriptor(
                EntityPropertyType.Entity,
                EntityPropertyKey.entity(StaticEntityProperties.ParentPrimaryKey),
                'Parent',
                'Parent',
                undefined,
                undefined,
                ImmutableList()
            ))
        }
        if (entitySchema.locales.getOrElseGet(() => ImmutableList()).size > 0) {
            descriptors.push(new EntityPropertyDescriptor(
                EntityPropertyType.Entity,
                EntityPropertyKey.entity(StaticEntityProperties.Locales),
                'Locales',
                'Locales',
                undefined,
                undefined,
                ImmutableList()
            ))
        }
        if (entitySchema.withPrice.getOrElse(false)) {
            descriptors.push(new EntityPropertyDescriptor(
                EntityPropertyType.Entity,
                EntityPropertyKey.entity(StaticEntityProperties.PriceInnerRecordHandling),
                'Price inner record handling',
                'Price inner record handling',
                undefined,
                undefined,
                ImmutableList()
            ))
        }

        for (const attributeSchema of entitySchema.attributes.getOrElseGet(() => ImmutableMap()).values()) {
            descriptors.push(new EntityPropertyDescriptor(
                EntityPropertyType.Attributes,
                EntityPropertyKey.attributes(attributeSchema.nameVariants.getIfSupported()?.get(NamingConvention.CamelCase)!),
                attributeSchema.name,
                attributeSchema.name,
                undefined,
                attributeSchema,
                ImmutableList()
            ))
        }

        for (const associatedDataSchema of entitySchema.associatedData.getOrElseGet(() => ImmutableMap()).values()) {
            descriptors.push(new EntityPropertyDescriptor(
                EntityPropertyType.AssociatedData,
                EntityPropertyKey.associatedData(associatedDataSchema.nameVariants.getIfSupported()?.get(NamingConvention.CamelCase)!),
                associatedDataSchema.name,
                associatedDataSchema.name,
                undefined,
                associatedDataSchema,
                ImmutableList()
            ))
        }

        if (entitySchema.withPrice.getOrElse(false)) {
            descriptors.push(new EntityPropertyDescriptor(
                EntityPropertyType.Prices,
                EntityPropertyKey.prices(),
                'Prices',
                'Prices',
                undefined,
                undefined,
                ImmutableList()
            ))
        }

        for (const referenceSchema of entitySchema.references.getOrElseGet(() => ImmutableMap()).values()) {
            descriptors.push(new EntityPropertyDescriptor(
                EntityPropertyType.References,
                EntityPropertyKey.references(referenceSchema.nameVariants.getIfSupported()?.get(NamingConvention.CamelCase)!),
                referenceSchema.name,
                referenceSchema.name,
                undefined,
                referenceSchema,
                ImmutableList(
                    Array.from(referenceSchema.attributes.getIfSupported()?.values()!)
                        .map(attributeSchema => {
                            return new EntityPropertyDescriptor(
                                EntityPropertyType.ReferenceAttributes,
                                EntityPropertyKey.referenceAttributes(
                                    referenceSchema.nameVariants.getIfSupported()?.get(NamingConvention.CamelCase)!,
                                    attributeSchema.nameVariants.getIfSupported()?.get(NamingConvention.CamelCase)!
                                ),
                                attributeSchema.name,
                                `${referenceSchema.name}: ${attributeSchema.name}`,
                                referenceSchema,
                                attributeSchema,
                                ImmutableList()
                            )
                        })
                )
            ))
        }

        return descriptors
    }

    /**
     * Formats given value into string representation in given language. If it fails, it will use fallback formatter.
     *
     * @param value raw value to be formatted into string into given language
     * @param language desired language of formatted value
     * @param prettyPrint if value should be pretty printed
     */
    formatEntityPropertyValue(value: EntityPropertyValue | EntityPropertyValue[], language: EntityPropertyValueSupportedCodeLanguage, prettyPrint: boolean = false): string {
        // todo lho maybe markdown pretty printing logic should be here as well
        const formatter: EntityPropertyValueFormatter | undefined = this.entityPropertyValueFormatters.get(language)
        if (formatter == undefined) {
            throw new UnexpectedError(`Property value formatter for language ${language} is not registered.`)
        }
        return formatter.format(value, prettyPrint)
    }

    private getQueryBuilder(language: QueryLanguage): QueryBuilder {
        const queryBuilder: QueryBuilder | undefined = this.queryBuilders.get(language)
        if (queryBuilder == undefined) {
            throw new UnexpectedError(`Query builder for language ${language} is not registered.`)
        }
        return queryBuilder
    }

    private getQueryExecutor(language: QueryLanguage): QueryExecutor {
        const queryExecutor: QueryExecutor | undefined = this.queryExecutors.get(language)
        if (queryExecutor == undefined) {
            throw new UnexpectedError(`Query executor for language ${language} is not registered.`)
        }
        return queryExecutor
    }
}

export const useEntityViewerService = (): EntityViewerService => {
    return mandatoryInject(entityViewerServiceInjectionKey) as EntityViewerService
}
