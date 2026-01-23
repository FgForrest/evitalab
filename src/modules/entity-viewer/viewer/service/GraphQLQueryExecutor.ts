import { QueryExecutor } from '@/modules/entity-viewer/viewer/service/QueryExecutor'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import type { QueryResult } from '@/modules/entity-viewer/viewer/model/QueryResult'
import type { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import type { WritableEntityProperty } from '@/modules/entity-viewer/viewer/model/WritableEntityProperty'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { EntityReferenceValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { EntityPrices } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrices'
import { EntityPrice, EntityPriceJson } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'
import { QueryError } from '@/modules/database-driver/exception/QueryError'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'

/**
 * Represents attribute values in GraphQL response
 */
type GraphQLAttributes = Record<string, unknown>

/**
 * Represents associated data in GraphQL response
 */
type GraphQLAssociatedData = Record<string, unknown>

/**
 * Represents a referenced entity in GraphQL response
 */
interface GraphQLReferencedEntity {
    [EntityPropertyType.Attributes]?: GraphQLAttributes
    [key: string]: unknown
}

/**
 * Represents a reference in GraphQL response
 */
interface GraphQLReference {
    referencedPrimaryKey: number
    referencedEntity?: GraphQLReferencedEntity
    [EntityPropertyType.Attributes]?: GraphQLAttributes
}

/**
 * Represents an entity in GraphQL response
 */
interface GraphQLEntity {
    [StaticEntityProperties.PrimaryKey]?: number
    [StaticEntityProperties.Version]?: number
    [StaticEntityProperties.Scope]?: string
    [StaticEntityProperties.Locales]?: string[]
    [StaticEntityProperties.PriceInnerRecordHandling]?: string
    [EntityPropertyType.Attributes]?: GraphQLAttributes
    [EntityPropertyType.AssociatedData]?: GraphQLAssociatedData
    [EntityPropertyType.Prices]?: EntityPriceJson[]
    parents?: GraphQLEntity[]
    priceForSale?: EntityPriceJson
    [key: string]: unknown
}


/**
 * Query executor for GraphQL language.
 */
export class GraphQLQueryExecutor extends QueryExecutor {
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        super()
        this.evitaClient = evitaClient
    }

    async executeQuery(dataPointer: EntityViewerDataPointer, query: string): Promise<QueryResult> {
        const result = await this.evitaClient.queryCatalogUsingGraphQL(
            dataPointer.catalogName,
            GraphQLInstanceType.Data,
            query
        )
        if (result.errors) {
            throw new QueryError(result.errors)
        }

        const recordPage = (result?.data as Record<string, { recordPage?: { data?: GraphQLEntity[]; totalRecordCount?: number } }> | undefined)?.q?.recordPage
        return {
            entities: recordPage?.data?.map((entity: GraphQLEntity) => this.flattenEntity(dataPointer, entity)) || [],
            totalEntitiesCount: recordPage?.totalRecordCount || 0
        }
    }

    /**
     * Converts original rich entity into simplified flat entity that is displayable in table
     */
    private flattenEntity(dataPointer: EntityViewerDataPointer, entity: GraphQLEntity): FlatEntity {
        const flattenedProperties: (WritableEntityProperty | undefined)[] = []

        flattenedProperties.push([EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.PrimaryKey])])
        flattenedProperties.push([EntityPropertyKey.entity(StaticEntityProperties.Version), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.Version])])
        flattenedProperties.push([EntityPropertyKey.entity(StaticEntityProperties.Scope), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.Scope])])
        flattenedProperties.push(this.flattenParent(dataPointer, entity))
        flattenedProperties.push([EntityPropertyKey.entity(StaticEntityProperties.Locales), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.Locales])])
        flattenedProperties.push([EntityPropertyKey.entity(StaticEntityProperties.PriceInnerRecordHandling), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.PriceInnerRecordHandling])])
        flattenedProperties.push([EntityPropertyKey.scope(), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.Scope])])

        flattenedProperties.push(...this.flattenAttributes(entity))
        flattenedProperties.push(...this.flattenAssociatedData(entity))
        flattenedProperties.push(this.flattenPrices(entity))
        flattenedProperties.push(...this.flattenReferences(entity))

        return this.createFlatEntity(flattenedProperties)
    }

    private flattenParent(_dataPointer: EntityViewerDataPointer, entity: GraphQLEntity): WritableEntityProperty | undefined {
        const parentEntities: GraphQLEntity[] | undefined = entity['parents']
        if (!parentEntities || parentEntities.length == 0) {
            return undefined
        }
        if (parentEntities.length > 1) {
            throw new UnexpectedError(`There are more than one parent entity.`)
        }
        const parentEntity: GraphQLEntity = parentEntities[0]

        const parentPrimaryKey: number = parentEntity[StaticEntityProperties.PrimaryKey] ?? 0

        const representativeAttributes: (NativeValue | NativeValue[])[] = []
        const attributes: GraphQLAttributes = parentEntity[EntityPropertyType.Attributes] || {}
        for (const attributeName in attributes) {
            representativeAttributes.push(this.wrapRawValueIntoNativeValue(attributes[attributeName]))
        }

        const parentReference: EntityReferenceValue = new EntityReferenceValue(parentPrimaryKey, representativeAttributes.flat())
        return [EntityPropertyKey.entity(StaticEntityProperties.ParentPrimaryKey), parentReference]
    }

    private flattenAttributes(entity: GraphQLEntity): WritableEntityProperty[] {
        const flattenedAttributes: WritableEntityProperty[] = []

        const attributes: GraphQLAttributes = entity[EntityPropertyType.Attributes] || {}
        for (const attributeName in attributes) {
            flattenedAttributes.push([EntityPropertyKey.attributes(attributeName), this.wrapRawValueIntoNativeValue(attributes[attributeName])])
        }

        return flattenedAttributes
    }

    private flattenAssociatedData(entity: GraphQLEntity): WritableEntityProperty[] {
        const flattenedAssociatedData: WritableEntityProperty[] = []

        const associatedData: GraphQLAssociatedData = entity[EntityPropertyType.AssociatedData] || {}
        for (const associatedDataName in associatedData) {
            flattenedAssociatedData.push([EntityPropertyKey.associatedData(associatedDataName), this.wrapRawValueIntoNativeValue(associatedData[associatedDataName])])
        }

        return flattenedAssociatedData
    }

    private flattenPrices(entity: GraphQLEntity): WritableEntityProperty | undefined {
        const priceForSale: EntityPriceJson | undefined = entity['priceForSale']
        const prices: EntityPriceJson[] | undefined = entity[EntityPropertyType.Prices]
        if (priceForSale == undefined && prices == undefined) {
            return undefined
        }

        const entityPrices: EntityPrices = new EntityPrices(
            priceForSale != undefined ? EntityPrice.fromJson(priceForSale) : undefined,
            prices?.map(it => EntityPrice.fromJson(it)) || []
        )
        return [EntityPropertyKey.prices(), entityPrices]
    }

    private flattenReferences(entity: GraphQLEntity): WritableEntityProperty[] {
        const flattenedReferences: WritableEntityProperty[] = []

        const referenceKeys = Object.keys(entity).filter((it: string) => it.startsWith('reference_'))
        for (const referenceAlias of referenceKeys) {
            const referencesOfName = entity[referenceAlias] as GraphQLReference | GraphQLReference[] | undefined
            if (referencesOfName == undefined) {
                continue
            }
            const referenceName = referenceAlias.split('_')[1]
            if (referencesOfName instanceof Array) {
                const representativeValues: EntityReferenceValue[] = referencesOfName
                    .map(referenceOfName => this.resolveReferenceRepresentativeValue(referenceOfName))

                flattenedReferences.push([EntityPropertyKey.references(referenceName), representativeValues])

                const mergedReferenceAttributesByName: Map<string, EntityReferenceValue[]> = referencesOfName
                    .map(referenceOfName => this.flattenAttributesForSingleReference(referenceOfName))
                    .reduce(
                        (accumulator, referenceAttributes) => {
                            referenceAttributes.forEach(([attributeName, attributeValue]) => {
                                let attributes = accumulator.get(attributeName)
                                if (attributes == undefined) {
                                    attributes = []
                                    accumulator.set(attributeName, attributes)
                                }
                                attributes.push(attributeValue)
                            })
                            return accumulator
                        },
                        new Map<string, EntityReferenceValue[]>()
                    )
                mergedReferenceAttributesByName.forEach((attributeValues, attributeName) => {
                    flattenedReferences.push([EntityPropertyKey.referenceAttributes(referenceName, attributeName), attributeValues])
                })
            } else {
                const representativeValue: EntityReferenceValue = this.resolveReferenceRepresentativeValue(referencesOfName)
                flattenedReferences.push([EntityPropertyKey.references(referenceName), representativeValue])
            }
        }

        return flattenedReferences
    }

    private resolveReferenceRepresentativeValue(reference: GraphQLReference): EntityReferenceValue {
        const referencedPrimaryKey: number = reference['referencedPrimaryKey']
        const representativeAttributes: (NativeValue | NativeValue[])[] = []

        const attributes: GraphQLAttributes = reference['referencedEntity']?.[EntityPropertyType.Attributes] || {}
        for (const attributeName in attributes) {
            representativeAttributes.push(this.wrapRawValueIntoNativeValue(attributes[attributeName]))
        }

        return new EntityReferenceValue(referencedPrimaryKey, representativeAttributes.flat())
    }

    private flattenAttributesForSingleReference(reference: GraphQLReference): [string, EntityReferenceValue][] {
        const referencedPrimaryKey: number = reference['referencedPrimaryKey']
        const flattenedAttributes: [string, EntityReferenceValue][] = []

        const attributes: GraphQLAttributes = reference[EntityPropertyType.Attributes] || {}
        for (const attributeName in attributes) {
            const wrappedValue: NativeValue | NativeValue[] = this.wrapRawValueIntoNativeValue(attributes[attributeName])
            flattenedAttributes.push([attributeName, new EntityReferenceValue(referencedPrimaryKey, wrappedValue instanceof Array ? wrappedValue : [wrappedValue])])
        }

        return flattenedAttributes
    }
}
