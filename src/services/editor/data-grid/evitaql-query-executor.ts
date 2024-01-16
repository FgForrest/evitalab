import { QueryExecutor } from '@/services/editor/data-grid/query-executor'
import { LabService } from '@/services/lab.service'
import {
    DataGridDataPointer, EntityPrice, EntityPrices, EntityProperty, EntityPropertyKey,
    EntityPropertyType, EntityReferenceValue, FlatEntity,
    QueryResult,
    StaticEntityProperties
} from '@/model/editor/data-grid'
import { EvitaDBClient } from '@/services/evitadb-client'
import { Response } from '@/model/evitadb'

/**
 * Query executor for EvitaQL language.
 */
export class EvitaQLQueryExecutor extends QueryExecutor {
    private readonly evitaDBClient: EvitaDBClient

    constructor(labService: LabService, evitaDBClient: EvitaDBClient) {
        super(labService)
        this.evitaDBClient = evitaDBClient
    }

    async executeQuery(dataPointer: DataGridDataPointer, query: string): Promise<QueryResult> {
        const result: Response = await this.evitaDBClient.queryEntities(dataPointer.connection, dataPointer.catalogName, query)
        return {
            entities: result?.recordPage?.data.map((entity: any) => this.flattenEntity(entity)) || [],
            totalEntitiesCount: result?.recordPage?.totalRecordCount || 0
        }
    }

    /**
     * Converts original rich entity into simplified flat entity that is displayable in table
     */
    private flattenEntity(entity: any): FlatEntity {
        const flattenedEntity: (EntityProperty | undefined)[] = []

        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.PrimaryKey])])
        flattenedEntity.push(this.flattenParent(entity))
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.Locales), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.Locales] || [])])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.AllLocales), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.AllLocales] || [])])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.PriceInnerRecordHandling), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.PriceInnerRecordHandling] || 'UNKNOWN')])

        flattenedEntity.push(...this.flattenAttributes(entity))
        flattenedEntity.push(...this.flattenAssociatedData(entity))
        flattenedEntity.push(this.flattenPrices(entity))
        flattenedEntity.push(...this.flattenReferences(entity))

        return flattenedEntity.filter(it => it != undefined) as FlatEntity
    }

    private flattenParent(entity: any): EntityProperty | undefined {
        const parentEntity: any | undefined = entity['parentEntity']
        if (parentEntity == undefined) {
            return undefined
        }

        const parentPrimaryKey: number = parentEntity[StaticEntityProperties.PrimaryKey]

        const representativeAttributes: any[] = []
        const globalRepresentativeAttributes = parentEntity?.['attributes']?.['global'] || {}
        for (const attributeName in globalRepresentativeAttributes) {
            representativeAttributes.push(globalRepresentativeAttributes[attributeName])
        }
        const localizedRepresentativeAttributes = parentEntity?.['attributes']?.['localized'] || {}
        for (const attributeName in localizedRepresentativeAttributes) {
            representativeAttributes.push(localizedRepresentativeAttributes[attributeName])
        }

        const parentReference: EntityReferenceValue = new EntityReferenceValue(parentPrimaryKey, representativeAttributes)
        return [EntityPropertyKey.entity(StaticEntityProperties.ParentPrimaryKey), parentReference]
    }

    private flattenAttributes(entity: any): EntityProperty[] {
        const flattenedAttributes: EntityProperty[] = []

        const globalAttributes = entity[EntityPropertyType.Attributes]?.['global'] || {}
        for (const attributeName in globalAttributes) {
            flattenedAttributes.push([EntityPropertyKey.attributes(attributeName), this.wrapRawValueIntoNativeValue(globalAttributes[attributeName])])
        }
        const localizedAttributes = entity[EntityPropertyType.Attributes]?.['localized'] || {}
        for (const locale in localizedAttributes) {
            // this expects that we support only one locale
            const attributesInLocale = localizedAttributes[locale]
            for (const attributeName in attributesInLocale) {
                flattenedAttributes.push([EntityPropertyKey.attributes(attributeName), this.wrapRawValueIntoNativeValue(attributesInLocale[attributeName])])
            }
        }

        return flattenedAttributes
    }

    private flattenAssociatedData(entity: any): EntityProperty[] {
        const flattenedAssociatedData: EntityProperty[] = []

        const globalAssociatedData = entity[EntityPropertyType.AssociatedData]?.['global'] || {}
        for (const associatedDataName in globalAssociatedData) {
            flattenedAssociatedData.push([EntityPropertyKey.associatedData(associatedDataName), this.wrapRawValueIntoNativeValue(globalAssociatedData[associatedDataName])])
        }
        const localizedAssociatedData = entity[EntityPropertyType.AssociatedData]?.['localized'] || {}
        for (const locale in localizedAssociatedData) {
            // this expects that we support only one locale
            const associatedDataInLocale = localizedAssociatedData[locale]
            for (const associatedDataName in associatedDataInLocale) {
                flattenedAssociatedData.push([EntityPropertyKey.associatedData(associatedDataName), this.wrapRawValueIntoNativeValue(associatedDataInLocale[associatedDataName])])
            }
        }

        return flattenedAssociatedData
    }

    private flattenPrices(entity: any): EntityProperty | undefined {
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

    private flattenReferences(entity: any): EntityProperty[] {
        const flattenedReferences: EntityProperty[] = []

        const references = entity[EntityPropertyType.References] || {}
        for (const referenceName in references) {
            const referencesOfName = references[referenceName]
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
                    flattenedReferences.push([EntityPropertyKey.referenceAttributes(referenceName, attributeName), this.wrapRawValueIntoNativeValue(attributeValues)])
                })
            } else {
                const representativeValue: EntityReferenceValue = this.resolveReferenceRepresentativeValue(referencesOfName)
                flattenedReferences.push([EntityPropertyKey.references(referenceName), representativeValue])

                this.flattenAttributesForSingleReference(referencesOfName).forEach(([attributeName, attributeValue]) => {
                    flattenedReferences.push([EntityPropertyKey.referenceAttributes(referenceName, attributeName), this.wrapRawValueIntoNativeValue(attributeValue)])
                })
            }
        }

        return flattenedReferences
    }

    private resolveReferenceRepresentativeValue(reference: any): EntityReferenceValue {
        const referencedPrimaryKey: number = reference['referencedPrimaryKey']
        const representativeAttributes: any[] = []

        const globalRepresentativeAttributes = reference['referencedEntity']?.[EntityPropertyType.Attributes]?.['global'] || {}
        for (const attributeName in globalRepresentativeAttributes) {
            representativeAttributes.push(globalRepresentativeAttributes[attributeName])
        }

        const localizedRepresentativeAttributes = reference['referencedEntity']?.[EntityPropertyType.Attributes]?.['localized'] || {}
        for (const attributeName in localizedRepresentativeAttributes) {
            representativeAttributes.push(localizedRepresentativeAttributes[attributeName])
        }

        return new EntityReferenceValue(referencedPrimaryKey, representativeAttributes)
    }

    private flattenAttributesForSingleReference(reference: any): [string, EntityReferenceValue][] {
        const referencedPrimaryKey: number = reference['referencedPrimaryKey']
        const flattenedAttributes: [string, EntityReferenceValue][] = []

        const globalAttributes = reference[EntityPropertyType.Attributes]?.['global'] || {}
        for (const attributeName in globalAttributes) {
            flattenedAttributes.push([attributeName, new EntityReferenceValue(referencedPrimaryKey, [globalAttributes[attributeName]])])
        }
        const localizedAttributes = reference[EntityPropertyType.Attributes]?.['localized'] || {}
        for (const locale in localizedAttributes) {
            // this expects that we support only one locale
            const attributesInLocale = localizedAttributes[locale]
            for (const attributeName in attributesInLocale) {
                flattenedAttributes.push([attributeName, new EntityReferenceValue(referencedPrimaryKey, [attributesInLocale[attributeName]])])
            }
        }

        return flattenedAttributes
    }
}
