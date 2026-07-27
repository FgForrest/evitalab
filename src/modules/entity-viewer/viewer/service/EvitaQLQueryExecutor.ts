import { QueryExecutor } from '@/modules/entity-viewer/viewer/service/QueryExecutor'
import type { ReferenceClassification } from '@/modules/entity-viewer/viewer/service/QueryExecutor'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import type { QueryResult } from '@/modules/entity-viewer/viewer/model/QueryResult'
import type { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import type { WritableEntityProperty } from '@/modules/entity-viewer/viewer/model/WritableEntityProperty'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'
import { EntityReferenceValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { EntityReferences } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferences'
import {
    EntityReferenceAttributes
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceAttributes'
import { EntityPrice } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { EntityPrices } from '../model/entity-property-value/EntityPrices'
import { GroupByUtil } from '@/utils/GroupByUtil'
import type { Grouped } from '@/utils/GroupByUtil'
import { List as ImmutableList } from 'immutable'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { EvitaResponse } from '@/modules/database-driver/request-response/data/EvitaResponse'
import { Entity } from '@/modules/database-driver/request-response/data/Entity'
import { Locale } from '@/modules/database-driver/data-type/Locale'
import { EntityReferenceWithParent } from '@/modules/database-driver/request-response/data/EntityReferenceWithParent'
import { Price } from '@/modules/database-driver/request-response/data/Price'
import { Reference } from '@/modules/database-driver/request-response/data/Reference'
import { getEnumKeyByValue } from '@/utils/enum.ts'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

/**
 * Query executor for EvitaQL language.
 */
export class EvitaQLQueryExecutor extends QueryExecutor {
    protected readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        super()
        this.evitaClient = evitaClient
    }

    async executeQuery(
        dataPointer: EntityViewerDataPointer,
        query: string,
        requiredData: EntityPropertyKey[]
    ): Promise<QueryResult> {
        const result: EvitaResponse = await this.evitaClient.queryCatalog(
            dataPointer.catalogName,
            session => session.query(query),
            true // we want to load fresh entity data every time
        )

        const entitySchema: EntitySchema = await this.evitaClient.queryCatalog(
            dataPointer.catalogName,
            async session => await session.getEntitySchemaOrThrowException(dataPointer.entityType)
        )
        const referenceClassifications: Map<string, ReferenceClassification> = this.buildReferenceClassifications(
            entitySchema,
            requiredData,
            attribute => attribute.name
        )

        return {
            entities:
                result
                    .recordPage
                    .data.map((entity: Entity) => this.flattenEntity(entity, referenceClassifications)) ||
                [],
            totalEntitiesCount:
                result.recordPage.totalRecordCount || 0,
        }
    }

    /**
     * Converts original rich entity into simplified flat entity that is displayable in table
     */
    private flattenEntity(entity: Entity, referenceClassifications: Map<string, ReferenceClassification>): FlatEntity {
        const flattenedProperties: (WritableEntityProperty | undefined)[] = []

        flattenedProperties.push([
            EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey),
            this.wrapRawValueIntoNativeValue(entity.primaryKey)
        ])
        flattenedProperties.push([
            EntityPropertyKey.entity(StaticEntityProperties.Version),
            this.wrapRawValueIntoNativeValue(entity.version)
        ])
        flattenedProperties.push(this.flattenParent(entity))

        const newLocales: Locale[] = []
        const locales = entity.locales

        for (const locale of locales) {
            newLocales.push(locale)
        }

        flattenedProperties.push([
            EntityPropertyKey.entity(StaticEntityProperties.Locales),
            this.wrapRawValueIntoNativeValue(newLocales),
        ])

        flattenedProperties.push([
            EntityPropertyKey.entity(
                StaticEntityProperties.PriceInnerRecordHandling
            ),
            new NativeValue(entity.priceInnerRecordHandling),
        ])

        flattenedProperties.push([
            EntityPropertyKey.entity(
                StaticEntityProperties.Scope
            ),
            new NativeValue(getEnumKeyByValue(EntityScope, entity.scope)),
        ])

        flattenedProperties.push(...this.flattenAttributes(entity))
        flattenedProperties.push(...this.flattenAssociatedData(entity))
        flattenedProperties.push(this.flattenPrices(entity))
        flattenedProperties.push(...this.flattenReferences(entity, referenceClassifications))
        return this.createFlatEntity(flattenedProperties)
    }

    private flattenParent(entity: Entity): WritableEntityProperty | undefined {
        const parentEntity: EntityReferenceWithParent | undefined = entity.parentEntity
        if (parentEntity == undefined) {
            return undefined
        }

        const representativeAttributes: (NativeValue | NativeValue[])[] = []
        if (parentEntity instanceof Entity) {
            representativeAttributes.push(
                ...parentEntity.allAttributes
                    .map(it => this.wrapRawValueIntoNativeValue(it.value))
                    .toArray()
            )
        }

        const parentReference: EntityReferenceValue = new EntityReferenceValue(
            parentEntity.primaryKey,
            representativeAttributes.flat()
        )
        return [
            EntityPropertyKey.entity(StaticEntityProperties.ParentPrimaryKey),
            parentReference,
        ]
    }

    private flattenAttributes(entity: Entity): WritableEntityProperty[] {
        const flattenedAttributes: WritableEntityProperty[] = []

        entity.allAttributes.forEach(it =>
            flattenedAttributes.push([
                EntityPropertyKey.attributes(it.name),
                this.wrapRawValueIntoNativeValue(it.value)
            ]))

        return flattenedAttributes
    }

    private flattenAssociatedData(entity: Entity): WritableEntityProperty[] {
        const flattenedAssociatedData: WritableEntityProperty[] = []

        entity.allAssociatedData.forEach(it =>
            flattenedAssociatedData.push([
                EntityPropertyKey.associatedData(it.name),
                this.wrapRawValueIntoNativeValue(it.value)
            ]))

        return flattenedAssociatedData
    }

    private flattenPrices(entity: Entity): WritableEntityProperty | undefined {
        const priceForSale: Price | undefined = entity.priceForSale
        const prices: ImmutableList<Price> = entity.prices
        if (priceForSale == undefined && prices == undefined) {
            return undefined
        }

        const entityPrices: EntityPrice[] = []
        if (prices != undefined) {
            for (const price of prices) {
                entityPrices.push(EntityPrice.fromPrice(price))
            }
        }

        if (priceForSale != undefined) {
            return [
                EntityPropertyKey.prices(),
                new EntityPrices(
                    EntityPrice.fromPrice(priceForSale),
                    entityPrices
                ),
            ]
        } else {
            return [
                EntityPropertyKey.prices(),
                new EntityPrices(undefined, entityPrices),
            ]
        }
    }

    private flattenReferences(entity: Entity, referenceClassifications: Map<string, ReferenceClassification>): WritableEntityProperty[] {
        const flattenedReferences: WritableEntityProperty[] = []

        const references = entity.references;
        const grouped: Grouped<Reference> = GroupByUtil.groupBy(references.toArray(), 'referenceName');

        for (const referenceName in grouped) { // by reference name
            if (Object.prototype.hasOwnProperty.call(grouped, referenceName)) {
                const referenceGroup: Reference[] | undefined = grouped[referenceName]
                if (referenceGroup == undefined) {
                    continue
                }
                const classification: ReferenceClassification | undefined = referenceClassifications.get(referenceName)

                const referenceValues: EntityReferenceValue[] = referenceGroup
                    .map((referenceOfName) => this.buildReferenceValue(referenceOfName, classification))

                // references column holds a single container with all references of this name
                flattenedReferences.push([
                    EntityPropertyKey.references(referenceName),
                    new EntityReferences(referenceName, referenceValues)
                ])

                // reference-attribute columns: one container per selected column, carrying the attribute value per reference
                if (classification != undefined && classification.selectedColumnAttributeNames.size > 0) {
                    const valuesByColumn: Map<string, EntityReferenceValue[]> = new Map<string, EntityReferenceValue[]>()
                    referenceGroup.forEach((referenceOfName, index) => {
                        const referenceValue: EntityReferenceValue = referenceValues[index]!
                        referenceOfName.allAttributes.forEach(it => {
                            if (!classification.selectedColumnAttributeNames.has(it.name)) {
                                return
                            }
                            const wrappedValue: NativeValue | NativeValue[] = this.wrapRawValueIntoNativeValue(it.value)
                            const columnValue: EntityReferenceValue = new EntityReferenceValue(
                                referenceValue.primaryKey,
                                wrappedValue instanceof Array ? wrappedValue : [wrappedValue],
                                referenceValue.representativeReferenceAttributes,
                                referenceValue.targetRepresentativeAttributes,
                                referenceValue.groupPrimaryKey
                            )
                            let values = valuesByColumn.get(it.name)
                            if (values == undefined) {
                                values = []
                                valuesByColumn.set(it.name, values)
                            }
                            values.push(columnValue)
                        })
                    })
                    valuesByColumn.forEach((values, attributeName) => {
                        flattenedReferences.push([
                            EntityPropertyKey.referenceAttributes(referenceName, attributeName),
                            new EntityReferenceAttributes(referenceName, attributeName, values)
                        ])
                    })
                }
            }
        }

        // backfill empty containers for selected references (and their columns) the entity has none of, so the grid
        // renders a "0 references" summary instead of a null cell
        this.backfillEmptyReferenceContainers(flattenedReferences, referenceClassifications)

        return flattenedReferences;
    }

    /**
     * Builds a single reference item carrying the target entity's representative attributes (both as the legacy flat
     * list and as a named map) and the reference's own representative attributes as a named map for grouping/filtering.
     */
    private buildReferenceValue(
        reference: Reference,
        classification: ReferenceClassification | undefined
    ): EntityReferenceValue {
        const referencedPrimaryKey: number = reference.referencedPrimaryKey

        const representativeAttributes: EntityPropertyValue[] = []
        const targetRepresentativeAttributes: Map<string, EntityPropertyValue> = new Map<string, EntityPropertyValue>()
        if (reference.referencedEntity instanceof Entity) {
            reference.referencedEntity.allAttributes.forEach(it => {
                const wrappedValue: NativeValue | NativeValue[] = this.wrapRawValueIntoNativeValue(it.value)
                if (wrappedValue instanceof Array) {
                    representativeAttributes.push(...wrappedValue)
                } else {
                    representativeAttributes.push(wrappedValue)
                }
                targetRepresentativeAttributes.set(it.name, this.toSingleValue(wrappedValue))
            })
        }

        const representativeReferenceAttributes: Map<string, EntityPropertyValue> = new Map<string, EntityPropertyValue>()
        if (classification != undefined && classification.representativeAttributeNames.size > 0) {
            reference.allAttributes.forEach(it => {
                if (classification.representativeAttributeNames.has(it.name)) {
                    representativeReferenceAttributes.set(it.name, this.toSingleValue(this.wrapRawValueIntoNativeValue(it.value)))
                }
            })
        }

        const groupPrimaryKey: number | undefined =
            classification?.referenceSchema.referencedGroupTypeManaged === true
                ? reference.groupReferencedEntity?.primaryKey
                : undefined

        return new EntityReferenceValue(
            referencedPrimaryKey ?? 0,
            representativeAttributes,
            representativeReferenceAttributes.size > 0 ? representativeReferenceAttributes : undefined,
            targetRepresentativeAttributes.size > 0 ? targetRepresentativeAttributes : undefined,
            groupPrimaryKey
        )
    }

}
