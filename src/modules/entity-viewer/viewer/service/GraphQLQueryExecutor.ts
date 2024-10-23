import { QueryExecutor } from '@/modules/entity-viewer/viewer/service/QueryExecutor'
import { GraphQLClient } from '@/modules/graphql-console/driver/service/GraphQLClient'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import { QueryResult } from '@/modules/entity-viewer/viewer/model/QueryResult'
import { QueryError } from '@/modules/connection/exception/QueryError'
import { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import { WritableEntityProperty } from '@/modules/entity-viewer/viewer/model/WritableEntityProperty'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { EntityReferenceValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { EntityPrices } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrices'
import { EntityPrice } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'


/**
 * Query executor for GraphQL language.
 */
export class GraphQLQueryExecutor extends QueryExecutor {
    private readonly graphQLClient: GraphQLClient

    constructor(connectionService: ConnectionService, graphQLClient: GraphQLClient) {
        super(connectionService)
        this.graphQLClient = graphQLClient
    }

    async executeQuery(dataPointer: EntityViewerDataPointer, query: string): Promise<QueryResult> {
        const result = await this.graphQLClient.fetch(dataPointer.connection, dataPointer.catalogName, query)
        if (result.errors) {
            throw new QueryError(dataPointer.connection, result.errors)
        }

        return {
            entities: result?.data?.q?.recordPage?.data.map((entity: any) => this.flattenEntity(dataPointer, entity)) || [],
            totalEntitiesCount: result?.data?.q?.recordPage?.totalRecordCount || 0
        }
    }

    /**
     * Converts original rich entity into simplified flat entity that is displayable in table
     */
    private flattenEntity(dataPointer: EntityViewerDataPointer, entity: any): FlatEntity {
        const flattenedProperties: (WritableEntityProperty | undefined)[] = []

        flattenedProperties.push([EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.PrimaryKey])])
        flattenedProperties.push([EntityPropertyKey.entity(StaticEntityProperties.Version), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.Version])])
        flattenedProperties.push(this.flattenParent(dataPointer, entity))
        flattenedProperties.push([EntityPropertyKey.entity(StaticEntityProperties.Locales), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.Locales])])
        flattenedProperties.push([EntityPropertyKey.entity(StaticEntityProperties.PriceInnerRecordHandling), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.PriceInnerRecordHandling])])

        flattenedProperties.push(...this.flattenAttributes(entity))
        flattenedProperties.push(...this.flattenAssociatedData(entity))
        flattenedProperties.push(this.flattenPrices(entity))
        flattenedProperties.push(...this.flattenReferences(entity))

        return this.createFlatEntity(flattenedProperties)
    }

    private flattenParent(dataPointer: EntityViewerDataPointer, entity: any): WritableEntityProperty | undefined {
        const parentEntities: any[] | undefined = entity['parents']
        if (!parentEntities || parentEntities.length == 0) {
            return undefined
        }
        if (parentEntities.length > 1) {
            throw new UnexpectedError(`There are more than one parent entity.`)
        }
        const parentEntity: any = parentEntities[0]

        const parentPrimaryKey: number = parentEntity[StaticEntityProperties.PrimaryKey]

        const representativeAttributes: (NativeValue | NativeValue[])[] = []
        const attributes = parentEntity[EntityPropertyType.Attributes] || {}
        for (const attributeName in attributes) {
            representativeAttributes.push(this.wrapRawValueIntoNativeValue(attributes[attributeName]))
        }

        const parentReference: EntityReferenceValue = new EntityReferenceValue(parentPrimaryKey, representativeAttributes.flat())
        return [EntityPropertyKey.entity(StaticEntityProperties.ParentPrimaryKey), parentReference]
    }

    private flattenAttributes(entity: any): WritableEntityProperty[] {
        const flattenedAttributes: WritableEntityProperty[] = []

        const attributes = entity[EntityPropertyType.Attributes] || {}
        for (const attributeName in attributes) {
            flattenedAttributes.push([EntityPropertyKey.attributes(attributeName), this.wrapRawValueIntoNativeValue(attributes[attributeName])])
        }

        return flattenedAttributes
    }

    private flattenAssociatedData(entity: any): WritableEntityProperty[] {
        const flattenedAssociatedData: WritableEntityProperty[] = []

        const associatedData = entity[EntityPropertyType.AssociatedData] || {}
        for (const associatedDataName in associatedData) {
            flattenedAssociatedData.push([EntityPropertyKey.associatedData(associatedDataName), this.wrapRawValueIntoNativeValue(associatedData[associatedDataName])])
        }

        return flattenedAssociatedData
    }

    private flattenPrices(entity: any): WritableEntityProperty | undefined {
        const priceForSale: any | undefined = entity['priceForSale']
        const prices: any[] | undefined = entity[EntityPropertyType.Prices]
        if (priceForSale == undefined && prices == undefined) {
            return undefined
        }

        const entityPrices: EntityPrices = new EntityPrices(
            priceForSale != undefined ? EntityPrice.fromJson(priceForSale) : undefined,
            prices?.map(it => EntityPrice.fromJson(it)) || []
        )
        return [EntityPropertyKey.prices(), entityPrices]
    }

    private flattenReferences(entity: any): WritableEntityProperty[] {
        const flattenedReferences: WritableEntityProperty[] = []

        const references = Object.keys(entity).filter((it: string) => it.startsWith('reference_'))
        for (const referenceAlias of references) {
            const referencesOfName = entity[referenceAlias]
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

    private resolveReferenceRepresentativeValue(reference: any): EntityReferenceValue {
        const referencedPrimaryKey: number = reference['referencedPrimaryKey']
        const representativeAttributes: (NativeValue | NativeValue[])[] = []

        const attributes = reference['referencedEntity']?.[EntityPropertyType.Attributes] || {}
        for (const attributeName in attributes) {
            representativeAttributes.push(this.wrapRawValueIntoNativeValue(attributes[attributeName]))
        }

        return new EntityReferenceValue(referencedPrimaryKey, representativeAttributes.flat())
    }

    private flattenAttributesForSingleReference(reference: any): [string, EntityReferenceValue][] {
        const referencedPrimaryKey: number = reference['referencedPrimaryKey']
        const flattenedAttributes: [string, EntityReferenceValue][] = []

        const attributes = reference[EntityPropertyType.Attributes] || {}
        for (const attributeName in attributes) {
            const wrappedValue: NativeValue | NativeValue[] = this.wrapRawValueIntoNativeValue(attributes[attributeName])
            flattenedAttributes.push([attributeName, new EntityReferenceValue(referencedPrimaryKey, wrappedValue instanceof Array ? wrappedValue : [wrappedValue])])
        }

        return flattenedAttributes
    }
}
