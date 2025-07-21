import { QueryExecutor } from '@/modules/entity-viewer/viewer/service/QueryExecutor'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import type { QueryResult } from '@/modules/entity-viewer/viewer/model/QueryResult'
import type { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import type { WritableEntityProperty } from '@/modules/entity-viewer/viewer/model/WritableEntityProperty'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'
import { EntityReferenceValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { EntityPrice } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { EntityPrices } from '../model/entity-property-value/EntityPrices'
import { GroupByUtil } from '@/utils/GroupByUtil'
import type { Grouped } from '@/utils/GroupByUtil'
import { List as ImmutableList } from 'immutable'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
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
        query: string
    ): Promise<QueryResult> {
        const result: EvitaResponse = await this.evitaClient.queryCatalog(
            dataPointer.catalogName,
            session => session.query(query),
            true // we want to load fresh entity data every time
        )
        return {
            entities:
                result
                    .recordPage
                    .data.map((entity: Entity) => this.flattenEntity(entity)) ||
                [],
            totalEntitiesCount:
                result.recordPage.totalRecordCount || 0,
        }
    }

    /**
     * Converts original rich entity into simplified flat entity that is displayable in table
     */
    private flattenEntity(entity: Entity): FlatEntity {
        const flattenedProperties: (WritableEntityProperty | undefined)[] = []

        flattenedProperties.push([
            EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey),
            this.wrapRawValueIntoNativeValue(entity.primaryKey)
        ])
        flattenedProperties.push([
            EntityPropertyKey.entity(StaticEntityProperties.Version),
            this.wrapRawValueIntoNativeValue(entity.version)
        ])

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
        flattenedProperties.push(...this.flattenReferences(entity))
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

    private flattenReferences(entity: Entity): WritableEntityProperty[] {
        const flattenedReferences: WritableEntityProperty[] = []

        const references = entity.references;
        const grouped: Grouped<Reference> = GroupByUtil.groupBy(references.toArray(), 'referenceName');

        for (const referenceName in grouped) { // by reference name
            if (Object.prototype.hasOwnProperty.call(grouped, referenceName)) {
                const referenceGroup: Reference[] = grouped[referenceName]
                if (referenceGroup == undefined) {
                    continue
                }

                const representativeValues: EntityReferenceValue[] = referenceGroup.map((referenceOfName) =>
                    this.resolveReferenceRepresentativeValue(referenceOfName)
                )

                flattenedReferences.push([
                    EntityPropertyKey.references(referenceName),
                    representativeValues
                ])

                const mergedReferenceAttributesByName: Map<string, EntityReferenceValue[]> = referenceGroup
                    .map((referenceOfName) => this.flattenAttributesForSingleReference(referenceOfName))
                    .reduce((accumulator, referenceAttributes) => {
                        referenceAttributes.forEach(([attributeName, attributeValue]) => {
                            let attributes = accumulator.get(attributeName)
                            if (!attributes) {
                                attributes = []
                                accumulator.set(attributeName, attributes)
                            }
                            attributes.push(attributeValue)
                        })
                        return accumulator
                    }, new Map<string, EntityReferenceValue[]>())

                mergedReferenceAttributesByName.forEach((attributeValues, attributeName) => {
                    flattenedReferences.push([
                        EntityPropertyKey.referenceAttributes(referenceName, attributeName),
                        attributeValues
                    ])
                })
            }
        }

        return flattenedReferences;
    }

    private resolveReferenceRepresentativeValue(
        reference: Reference
    ): EntityReferenceValue {
        const referencedPrimaryKey: number = reference.referencedPrimaryKey
        const representativeAttributes: (EntityPropertyValue | EntityPropertyValue[])[] = []

        if (reference.referencedEntity instanceof Entity) {
            reference.referencedEntity.allAttributes
                .forEach(it =>
                    representativeAttributes.push(this.wrapRawValueIntoNativeValue(it.value)))
        }

        return new EntityReferenceValue(
            referencedPrimaryKey ?? 0,
            representativeAttributes.flat()
        )
    }

    private flattenAttributesForSingleReference(
        reference: Reference
    ): [string, EntityReferenceValue][] {
        const referencedPrimaryKey: number = reference.referencedPrimaryKey
        const flattenedAttributes: [string, EntityReferenceValue][] = []

        reference.allAttributes
            .forEach(it => {
                const wrappedValue: NativeValue | NativeValue[] =
                    this.wrapRawValueIntoNativeValue(it.value)
                flattenedAttributes.push([
                    it.name,
                    new EntityReferenceValue(
                        referencedPrimaryKey,
                        wrappedValue instanceof Array
                            ? wrappedValue
                            : [wrappedValue]
                    )
                ] as [string, EntityReferenceValue])
            })

        return flattenedAttributes
    }

}
