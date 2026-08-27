import type { InjectionKey } from 'vue'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
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
import type { QueryBuilder } from '@/modules/entity-viewer/viewer/service/QueryBuilder'
import { QueryExecutor } from '@/modules/entity-viewer/viewer/service/QueryExecutor'
import type { EntityPropertyValueFormatter } from '@/modules/entity-viewer/viewer/service/EntityPropertyValueFormatter'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import type { QueryResult } from '@/modules/entity-viewer/viewer/model/QueryResult'
import { EntityPrice } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { EntityPrices } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrices'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import {
    EntityReferenceValue
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { EntityAttributeSchema } from '@/modules/database-driver/request-response/schema/EntityAttributeSchema'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { List as ImmutableList } from 'immutable'
import { EntityPropertyDescriptor } from '@/modules/entity-viewer/viewer/model/EntityPropertyDescriptor'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { Locale } from '@/modules/database-driver/data-type/Locale'
import { SelectedScope } from '@/modules/entity-viewer/viewer/model/SelectedScope.ts'
import { OrderDirection } from '@/modules/database-driver/request-response/schema/OrderDirection'
import { i18n } from '@/vue-plugins/i18n'

export const entityViewerServiceInjectionKey: InjectionKey<EntityViewerService> = Symbol('entityViewerService')

/**
 * Distinct preview values of each representative reference attribute, keyed by attribute name. Feeds the per-attribute
 * filter selects in the references / reference-attribute detail.
 */
export type ReferenceFilterData = Map<string, string[]>

/**
 * A single group of references sharing the same combination of representative reference attribute values.
 */
export type ReferenceGroup = {
    /** Stable, orderable identity of the group (equal to {@link label}). */
    key: string
    /** Human-readable `name = value · name2 = value2` header; empty when the reference schema has no representative attributes. */
    label: string
    /** References belonging to this group in server order. */
    items: EntityReferenceValue[]
}

/**
 * Service for running the entity viewer component.
 */
export class EntityViewerService {
    private readonly evitaClient: EvitaClient

    private readonly queryBuilders: Map<QueryLanguage, QueryBuilder> = new Map<QueryLanguage, QueryBuilder>()
    private readonly queryExecutors: Map<QueryLanguage, QueryExecutor> = new Map<QueryLanguage, QueryExecutor>()

    private readonly entityPropertyValueFormatters: Map<EntityPropertyValueSupportedCodeLanguage, EntityPropertyValueFormatter> = new Map<EntityPropertyValueSupportedCodeLanguage, EntityPropertyValueFormatter>()

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient

        this.queryBuilders.set(QueryLanguage.EvitaQL, new EvitaQLQueryBuilder(evitaClient))
        this.queryExecutors.set(QueryLanguage.EvitaQL, new EvitaQLQueryExecutor(evitaClient))

        this.queryBuilders.set(QueryLanguage.GraphQL, new GraphQLQueryBuilder(evitaClient))
        this.queryExecutors.set(QueryLanguage.GraphQL, new GraphQLQueryExecutor(evitaClient))

        this.entityPropertyValueFormatters.set(EntityPropertyValueSupportedCodeLanguage.Raw, new EntityPropertyValueRawFormatter())
        this.entityPropertyValueFormatters.set(EntityPropertyValueSupportedCodeLanguage.Json, new EntityPropertyValueJsonFormatter())
        this.entityPropertyValueFormatters.set(EntityPropertyValueSupportedCodeLanguage.Xml, new EntityPropertyValueXmlFormatter())
    }

    registerEntitySchemaChangeCallback(
        dataPointer: EntityViewerDataPointer,
        callback: () => Promise<void>
    ): string {
        return this.evitaClient.registerEntitySchemaChangedCallback(
            dataPointer.catalogName,
            dataPointer.entityType,
            callback
        )
    }

    unregisterEntitySchemaChangeCallback(
        dataPointer: EntityViewerDataPointer,
        id: string
    ): void {
        this.evitaClient.unregisterEntitySchemaChangedCallback(
            dataPointer.catalogName,
            dataPointer.entityType,
            id
        )
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
                       layersSelected: SelectedScope[],
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
            layersSelected,
            dataLocale,
            priceType,
            requiredData,
            pageNumber,
            pageSize
        )
        return queryExecutor.executeQuery(dataPointer, query, requiredData)
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
            undefined,
            [EntityPropertyKey.prices()],
            1,
            1
        )
        const result: QueryResult = await queryExecutor.executeQuery(dataPointer, query, [EntityPropertyKey.prices()])
        if (result.totalEntitiesCount === 0) {
            return undefined
        } else if (result.totalEntitiesCount != 1) {
            throw new UnexpectedError(`Expected 1 entity with price for sale, got ${result.totalEntitiesCount} entities.`)
        }
        const firstEntity = result.entities[0]
        if (firstEntity == undefined) {
            return undefined
        }
        return (firstEntity[EntityPropertyKey.prices().toString()] as EntityPrices | undefined)?.priceForSale
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
                                      columns: { key: string, order?: 'asc' | 'desc' }[]): Promise<string> {
        const entitySchema: EntitySchema = await this.evitaClient.queryCatalog(
            dataPointer.catalogName,
            async session => await session.getEntitySchemaOrThrowException(dataPointer.entityType)
        )
        const queryBuilder: QueryBuilder = this.getQueryBuilder(language)

        const orderBy: string[] = []
        for (const column of columns) {
            const orderDirection: OrderDirection = column.order === 'desc' ? OrderDirection.Desc : OrderDirection.Asc
            const propertyKey: EntityPropertyKey = EntityPropertyKey.fromString(column.key)
            if (propertyKey.type === EntityPropertyType.Entity && propertyKey.name === StaticEntityProperties.PrimaryKey) {
                orderBy.push(queryBuilder.buildPrimaryKeyOrderBy(orderDirection))
            } else if (propertyKey.type === EntityPropertyType.Attributes) {
                const attributeSchema: EntityAttributeSchema | undefined = entitySchema.attributes
                    .find(attributeSchema => attributeSchema.nameVariants
                        .get(NamingConvention.CamelCase) === propertyKey.name)
                if (attributeSchema == undefined) {
                    throw new UnexpectedError(`Entity ${entitySchema.name} does not have attribute ${propertyKey.name}.`)
                }

                orderBy.push(queryBuilder.buildAttributeOrderBy(attributeSchema, orderDirection))
            } else if (propertyKey.type === EntityPropertyType.ReferenceAttributes) {
                const referenceSchema: ReferenceSchema | undefined = entitySchema.references
                    .find(referenceSchema => referenceSchema.nameVariants
                        .get(NamingConvention.CamelCase) === propertyKey.parentName)
                if (referenceSchema == undefined) {
                    throw new UnexpectedError(`Entity ${entitySchema.name} does not have reference ${propertyKey.parentName}.`)
                }
                const attributeSchema: AttributeSchema | undefined = referenceSchema.attributes
                    .find(attributeSchema => attributeSchema.nameVariants
                        .get(NamingConvention.CamelCase) === propertyKey.name)
                if (attributeSchema == undefined) {
                    throw new UnexpectedError(`Reference ${referenceSchema.name} does not have attribute ${propertyKey.name}.`)
                }

                orderBy.push(queryBuilder.buildReferenceAttributeOrderBy(referenceSchema, attributeSchema, orderDirection))
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
     * Collects distinct preview values of every representative reference attribute present on the given references.
     * The result feeds one filter select per representative reference attribute. Empty when none of the references
     * carry representative reference attributes.
     */
    collectReferenceFilterData(references: EntityReferenceValue[]): ReferenceFilterData {
        const filterData: ReferenceFilterData = new Map<string, string[]>()
        for (const reference of references) {
            const attributes: Map<string, EntityPropertyValue> | undefined = reference.representativeReferenceAttributes
            if (attributes == undefined) {
                continue
            }
            for (const [attributeName, value] of attributes) {
                const preview: string = value.toPreviewString()
                let values: string[] | undefined = filterData.get(attributeName)
                if (values == undefined) {
                    values = []
                    filterData.set(attributeName, values)
                }
                if (!values.includes(preview)) {
                    values.push(preview)
                }
            }
        }
        for (const values of filterData.values()) {
            values.sort()
        }
        return filterData
    }

    /**
     * Filters references by the selected preview values of representative reference attributes. An attribute with no
     * selected value is ignored (does not narrow the result); references must match all attributes that do have a
     * selection.
     */
    filterReferences(references: EntityReferenceValue[], selections: Map<string, string[]>): EntityReferenceValue[] {
        return references.filter(reference => {
            for (const [attributeName, selectedValues] of selections) {
                if (selectedValues.length === 0) {
                    continue
                }
                const value: EntityPropertyValue | undefined = reference.representativeReferenceAttributes?.get(attributeName)
                const preview: string | undefined = value?.toPreviewString()
                if (preview == undefined || !selectedValues.includes(preview)) {
                    return false
                }
            }
            return true
        })
    }

    /**
     * Groups references by the unique combination of their representative reference attribute values. Groups are
     * ordered by their key; references inside a group keep server order. When the references carry no representative
     * reference attributes a single group with an empty label (flat list) is returned.
     */
    groupReferences(references: EntityReferenceValue[]): ReferenceGroup[] {
        const attributeNames: Set<string> = new Set<string>()
        for (const reference of references) {
            if (reference.representativeReferenceAttributes != undefined) {
                for (const attributeName of reference.representativeReferenceAttributes.keys()) {
                    attributeNames.add(attributeName)
                }
            }
        }
        const orderedAttributeNames: string[] = Array.from(attributeNames).sort()

        if (orderedAttributeNames.length === 0) {
            return references.length > 0
                ? [{ key: '', label: '', items: [...references] }]
                : []
        }

        const groupsByKey: Map<string, ReferenceGroup> = new Map<string, ReferenceGroup>()
        for (const reference of references) {
            const parts: string[] = orderedAttributeNames.map(attributeName => {
                const value: EntityPropertyValue | undefined = reference.representativeReferenceAttributes?.get(attributeName)
                return `${attributeName} = ${value != undefined ? value.toPreviewString() : ''}`
            })
            const label: string = parts.join(' · ')
            let group: ReferenceGroup | undefined = groupsByKey.get(label)
            if (group == undefined) {
                group = { key: label, label, items: [] }
                groupsByKey.set(label, group)
            }
            group.items.push(reference)
        }

        return Array.from(groupsByKey.keys())
            .sort()
            .map(key => groupsByKey.get(key)!)
    }

    /**
     * Returns a list of locales in which data are stored in given collection.
     */
    async getDataLocales(dataPointer: EntityViewerDataPointer): Promise<ImmutableList<Locale>> {
        const entitySchema: EntitySchema = await this.evitaClient.queryCatalog(
            dataPointer.catalogName,
            async session => await session.getEntitySchemaOrThrowException(dataPointer.entityType)
        )
        return entitySchema.locales
    }

    async supportsPrices(dataPointer: EntityViewerDataPointer): Promise<boolean> {
        const entitySchema: EntitySchema = await this.evitaClient.queryCatalog(
            dataPointer.catalogName,
            async session => await session.getEntitySchemaOrThrowException(dataPointer.entityType)
        )
        return entitySchema.withPrice
    }

    /**
     * Builds a list of all possible entity properties for entities of given schema.
     */
    async getEntityPropertyDescriptors(dataPointer: EntityViewerDataPointer): Promise<EntityPropertyDescriptor[]> {
        const entitySchema = await this.getEntitySchema(dataPointer)
        const descriptors: EntityPropertyDescriptor[] = []
        descriptors.push(this.createStaticEntityPropertyDescriptor(
            StaticEntityProperties.PrimaryKey,
            'entityViewer.grid.column.primaryKey'
        ))
        descriptors.push(this.createStaticEntityPropertyDescriptor(
            StaticEntityProperties.Version,
            'entityViewer.grid.column.version'
        ))
        descriptors.push(this.createStaticEntityPropertyDescriptor(
            StaticEntityProperties.Scope,
            'entityViewer.grid.column.scope'
        ))
        if (entitySchema.withHierarchy) {
            descriptors.push(this.createStaticEntityPropertyDescriptor(
                StaticEntityProperties.ParentPrimaryKey,
                'entityViewer.grid.column.parent'
            ))
        }
        if (entitySchema.locales.size > 0) {
            descriptors.push(this.createStaticEntityPropertyDescriptor(
                StaticEntityProperties.Locales,
                'entityViewer.grid.column.locales'
            ))
        }
        if (entitySchema.withPrice) {
            descriptors.push(this.createStaticEntityPropertyDescriptor(
                StaticEntityProperties.PriceInnerRecordHandling,
                'entityViewer.grid.column.priceInnerRecordHandling'
            ))
        }

        for (const attributeSchema of entitySchema.attributes.values()) {
            descriptors.push(new EntityPropertyDescriptor(
                EntityPropertyType.Attributes,
                EntityPropertyKey.attributes(attributeSchema.name),
                attributeSchema.name,
                attributeSchema.name,
                undefined,
                attributeSchema,
                ImmutableList()
            ))
        }

        for (const associatedDataSchema of entitySchema.associatedData.values()) {
            descriptors.push(new EntityPropertyDescriptor(
                EntityPropertyType.AssociatedData,
                EntityPropertyKey.associatedData(associatedDataSchema.name),
                associatedDataSchema.name,
                associatedDataSchema.name,
                undefined,
                associatedDataSchema,
                ImmutableList()
            ))
        }

        if (entitySchema.withPrice) {
            descriptors.push(new EntityPropertyDescriptor(
                EntityPropertyType.Prices,
                EntityPropertyKey.prices(),
                i18n.global.t('entityViewer.grid.column.prices'),
                i18n.global.t('entityViewer.grid.column.prices'),
                undefined,
                undefined,
                ImmutableList()
            ))
        }

        for (const referenceSchema of entitySchema.references.values()) {
            descriptors.push(new EntityPropertyDescriptor(
                EntityPropertyType.References,
                EntityPropertyKey.references(referenceSchema.name),
                referenceSchema.name,
                referenceSchema.name,
                undefined,
                referenceSchema,
                ImmutableList(
                    Array.from(referenceSchema.attributes.values())
                        .map(attributeSchema => {
                            return new EntityPropertyDescriptor(
                                EntityPropertyType.ReferenceAttributes,
                                EntityPropertyKey.referenceAttributes(
                                    referenceSchema.name,
                                    attributeSchema.name
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
     * Creates a descriptor of a static entity property, i.e. a property every entity has regardless of its schema.
     *
     * @param property static property the descriptor is created for
     * @param titleKey i18n key of the grid column title
     */
    private createStaticEntityPropertyDescriptor(property: StaticEntityProperties, titleKey: string): EntityPropertyDescriptor {
        const title: string = i18n.global.t(titleKey)
        return new EntityPropertyDescriptor(
            EntityPropertyType.Entity,
            EntityPropertyKey.entity(property),
            title,
            title,
            undefined,
            undefined,
            ImmutableList()
        )
    }

    /**
     * Formats given value into string representation in given language. If it fails, it will use fallback formatter.
     *
     * @param value raw value to be formatted into string into given language
     * @param language desired language of formatted value
     * @param prettyPrint if value should be pretty printed
     */
    formatEntityPropertyValue(value: EntityPropertyValue | EntityPropertyValue[], language: EntityPropertyValueSupportedCodeLanguage, prettyPrint: boolean = false): string {
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

    private async getEntitySchema(dataPointer: EntityViewerDataPointer): Promise<EntitySchema> {
        return await this.evitaClient.queryCatalog(
            dataPointer.catalogName,
            async session => await session.getEntitySchemaOrThrowException(dataPointer.entityType)
        )
    }
}

export const useEntityViewerService = (): EntityViewerService => {
    return mandatoryInject(entityViewerServiceInjectionKey) as EntityViewerService
}
