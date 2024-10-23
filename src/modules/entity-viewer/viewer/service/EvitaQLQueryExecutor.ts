import { QueryExecutor } from '@/modules/entity-viewer/viewer/service/QueryExecutor'
import { EvitaDBDriver } from '@/modules/connection/driver/EvitaDBDriver'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import { QueryResult } from '@/modules/entity-viewer/viewer/model/QueryResult'
import { Response } from '@/modules/connection/model/data/Response'
import { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import { WritableEntityProperty } from '@/modules/entity-viewer/viewer/model/WritableEntityProperty'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'
import { EntityReferenceValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { EntityPrice } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { EvitaDBDriverResolver } from '@/modules/connection/driver/EvitaDBDriverResolver'
import { Entity } from '@/modules/connection/model/data/Entity'
import { Price } from '@/modules/connection/model/data/Price'
import { Reference } from '@/modules/connection/model/data/Reference'
import { Locale } from '@/modules/connection/model/data-type/Locale'
import { EntityPrices } from '../model/entity-property-value/EntityPrices'
import { GroupByUtil, Grouped } from '@/utils/GroupByUtil'
import { EntityReferenceWithParent } from '@/modules/connection/model/data/EntityReferenceWithParent'
import Immutable from 'immutable'

/**
 * Query executor for EvitaQL language.
 */
export class EvitaQLQueryExecutor extends QueryExecutor {
    private readonly evitaDBDriverResolver: EvitaDBDriverResolver

    constructor(
        connectionService: ConnectionService,
        evitaDBDriverResolver: EvitaDBDriverResolver
    ) {
        super(connectionService)
        this.evitaDBDriverResolver = evitaDBDriverResolver
    }

    async executeQuery(
        dataPointer: EntityViewerDataPointer,
        query: string
    ): Promise<QueryResult> {
        const evitaDBDriver: EvitaDBDriver =
            await this.evitaDBDriverResolver.resolveDriver(
                dataPointer.connection
            )
        const result: Response = await evitaDBDriver.query(
            dataPointer.connection,
            dataPointer.catalogName,
            query
        )
        return {
            entities:
                result.recordPage
                    .getIfSupported()
                    ?.data.getIfSupported()
                    ?.map((entity: Entity) => this.flattenEntity(entity)) || [],
            totalEntitiesCount:
                result.recordPage
                    .getIfSupported()
                    ?.totalRecordCount?.getIfSupported() || 0,
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
        const prices: Immutable.List<Price> = entity.prices
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
