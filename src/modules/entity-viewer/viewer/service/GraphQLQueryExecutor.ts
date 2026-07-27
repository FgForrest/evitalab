import { QueryExecutor } from '@/modules/entity-viewer/viewer/service/QueryExecutor'
import type { ReferenceClassification } from '@/modules/entity-viewer/viewer/service/QueryExecutor'
import type { GraphQLResultNode } from '@/modules/database-driver/connector/gql/model/GraphQLResultNode'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import type { QueryResult } from '@/modules/entity-viewer/viewer/model/QueryResult'
import type { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import type { WritableEntityProperty } from '@/modules/entity-viewer/viewer/model/WritableEntityProperty'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { NativeValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/NativeValue'
import { EntityPropertyValue } from '@/modules/entity-viewer/viewer/model/EntityPropertyValue'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { EntityReferenceValue } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceValue'
import { EntityReferences } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferences'
import {
    EntityReferenceAttributes
} from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityReferenceAttributes'
import { EntityPrices } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrices'
import { EntityPrice } from '@/modules/entity-viewer/viewer/model/entity-property-value/EntityPrice'
import { QueryError } from '@/modules/database-driver/exception/QueryError'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'


/**
 * Query executor for GraphQL language.
 */
export class GraphQLQueryExecutor extends QueryExecutor {
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        super()
        this.evitaClient = evitaClient
    }

    async executeQuery(dataPointer: EntityViewerDataPointer, query: string, requiredData: EntityPropertyKey[]): Promise<QueryResult> {
        const result = await this.evitaClient.queryCatalogUsingGraphQL(
            dataPointer.catalogName,
            GraphQLInstanceType.Data,
            query
        )
        if (result.errors) {
            throw new QueryError(result.errors)
        }

        const entitySchema: EntitySchema = await this.evitaClient.queryCatalog(
            dataPointer.catalogName,
            session => session.getEntitySchemaOrThrowException(dataPointer.entityType)
        )
        const referenceClassifications: Map<string, ReferenceClassification> = this.buildReferenceClassifications(
            entitySchema,
            requiredData,
            attribute => attribute.nameVariants.get(NamingConvention.CamelCase)!
        )

        return {
            entities: result?.data?.q?.recordPage?.data.map((entity: GraphQLResultNode) => this.flattenEntity(dataPointer, entity, referenceClassifications)) || [],
            totalEntitiesCount: result?.data?.q?.recordPage?.totalRecordCount || 0
        }
    }

    /**
     * Converts original rich entity into simplified flat entity that is displayable in table
     */
    private flattenEntity(dataPointer: EntityViewerDataPointer, entity: GraphQLResultNode, referenceClassifications: Map<string, ReferenceClassification>): FlatEntity {
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
        flattenedProperties.push(...this.flattenReferences(entity, referenceClassifications))

        return this.createFlatEntity(flattenedProperties)
    }

    private flattenParent(_dataPointer: EntityViewerDataPointer, entity: GraphQLResultNode): WritableEntityProperty | undefined {
        const parentEntities: GraphQLResultNode[] | undefined = entity['parents']
        if (!parentEntities || parentEntities.length == 0) {
            return undefined
        }
        if (parentEntities.length > 1) {
            throw new UnexpectedError(`There are more than one parent entity.`)
        }
        const parentEntity: GraphQLResultNode | undefined = parentEntities[0]
        if (parentEntity == undefined) {
            return undefined
        }

        const parentPrimaryKey: number = parentEntity[StaticEntityProperties.PrimaryKey]

        const representativeAttributes: (NativeValue | NativeValue[])[] = []
        const attributes = parentEntity[EntityPropertyType.Attributes] || {}
        for (const attributeName in attributes) {
            representativeAttributes.push(this.wrapRawValueIntoNativeValue(attributes[attributeName]))
        }

        const parentReference: EntityReferenceValue = new EntityReferenceValue(parentPrimaryKey, representativeAttributes.flat())
        return [EntityPropertyKey.entity(StaticEntityProperties.ParentPrimaryKey), parentReference]
    }

    private flattenAttributes(entity: GraphQLResultNode): WritableEntityProperty[] {
        const flattenedAttributes: WritableEntityProperty[] = []

        const attributes = entity[EntityPropertyType.Attributes] || {}
        for (const attributeName in attributes) {
            flattenedAttributes.push([EntityPropertyKey.attributes(attributeName), this.wrapRawValueIntoNativeValue(attributes[attributeName])])
        }

        return flattenedAttributes
    }

    private flattenAssociatedData(entity: GraphQLResultNode): WritableEntityProperty[] {
        const flattenedAssociatedData: WritableEntityProperty[] = []

        const associatedData = entity[EntityPropertyType.AssociatedData] || {}
        for (const associatedDataName in associatedData) {
            flattenedAssociatedData.push([EntityPropertyKey.associatedData(associatedDataName), this.wrapRawValueIntoNativeValue(associatedData[associatedDataName])])
        }

        return flattenedAssociatedData
    }

    private flattenPrices(entity: GraphQLResultNode): WritableEntityProperty | undefined {
        const priceForSale: GraphQLResultNode | undefined = entity['priceForSale']
        const prices: GraphQLResultNode[] | undefined = entity[EntityPropertyType.Prices]
        if (priceForSale == undefined && prices == undefined) {
            return undefined
        }

        const entityPrices: EntityPrices = new EntityPrices(
            priceForSale != undefined ? EntityPrice.fromJson(priceForSale) : undefined,
            prices?.map(it => EntityPrice.fromJson(it)) || []
        )
        return [EntityPropertyKey.prices(), entityPrices]
    }

    private flattenReferences(entity: GraphQLResultNode, referenceClassifications: Map<string, ReferenceClassification>): WritableEntityProperty[] {
        const flattenedReferences: WritableEntityProperty[] = []

        const references = Object.keys(entity).filter((it: string) => it.startsWith('reference_'))
        for (const referenceAlias of references) {
            const referencesOfName = entity[referenceAlias]
            if (referencesOfName == undefined) {
                continue
            }
            const referenceName = referenceAlias.split('_')[1]
            if (referenceName == undefined) {
                continue
            }
            const classification: ReferenceClassification | undefined = referenceClassifications.get(referenceName)

            const referenceNodes: GraphQLResultNode[] = referencesOfName instanceof Array ? referencesOfName : [referencesOfName]
            const referenceValues: EntityReferenceValue[] = referenceNodes
                .map(referenceNode => this.buildReferenceValue(referenceNode, classification))

            // references column holds a single container with all references of this name
            flattenedReferences.push([EntityPropertyKey.references(referenceName), new EntityReferences(referenceName, referenceValues)])

            // reference-attribute columns: one container per selected column, carrying the attribute value per reference
            if (classification != undefined && classification.selectedColumnAttributeNames.size > 0) {
                const valuesByColumn: Map<string, EntityReferenceValue[]> = new Map<string, EntityReferenceValue[]>()
                referenceNodes.forEach((referenceNode, index) => {
                    const referenceValue: EntityReferenceValue = referenceValues[index]!
                    const attributes = referenceNode[EntityPropertyType.Attributes] || {}
                    for (const attributeName in attributes) {
                        if (!classification.selectedColumnAttributeNames.has(attributeName)) {
                            continue
                        }
                        const wrappedValue: NativeValue | NativeValue[] = this.wrapRawValueIntoNativeValue(attributes[attributeName])
                        const columnValue: EntityReferenceValue = new EntityReferenceValue(
                            referenceValue.primaryKey,
                            wrappedValue instanceof Array ? wrappedValue : [wrappedValue],
                            referenceValue.representativeReferenceAttributes,
                            referenceValue.targetRepresentativeAttributes,
                            referenceValue.groupPrimaryKey
                        )
                        let values = valuesByColumn.get(attributeName)
                        if (values == undefined) {
                            values = []
                            valuesByColumn.set(attributeName, values)
                        }
                        values.push(columnValue)
                    }
                })
                valuesByColumn.forEach((values, attributeName) => {
                    flattenedReferences.push([
                        EntityPropertyKey.referenceAttributes(referenceName, attributeName),
                        new EntityReferenceAttributes(referenceName, attributeName, values)
                    ])
                })
            }
        }

        // backfill empty containers for selected references (and their columns) the entity has none of, so the grid
        // renders a "0 references" summary instead of a null cell
        this.backfillEmptyReferenceContainers(flattenedReferences, referenceClassifications)

        return flattenedReferences
    }

    /**
     * Builds a single reference item carrying the target entity's representative attributes (both as the legacy flat
     * list and as a named map) and the reference's own representative attributes as a named map for grouping/filtering.
     */
    private buildReferenceValue(reference: GraphQLResultNode, classification: ReferenceClassification | undefined): EntityReferenceValue {
        const referencedPrimaryKey: number = reference['referencedPrimaryKey']

        const representativeAttributes: EntityPropertyValue[] = []
        const targetRepresentativeAttributes: Map<string, EntityPropertyValue> = new Map<string, EntityPropertyValue>()
        const targetAttributes = reference['referencedEntity']?.[EntityPropertyType.Attributes] || {}
        for (const attributeName in targetAttributes) {
            const wrappedValue: NativeValue | NativeValue[] = this.wrapRawValueIntoNativeValue(targetAttributes[attributeName])
            if (wrappedValue instanceof Array) {
                representativeAttributes.push(...wrappedValue)
            } else {
                representativeAttributes.push(wrappedValue)
            }
            targetRepresentativeAttributes.set(attributeName, this.toSingleValue(wrappedValue))
        }

        const representativeReferenceAttributes: Map<string, EntityPropertyValue> = new Map<string, EntityPropertyValue>()
        if (classification != undefined && classification.representativeAttributeNames.size > 0) {
            const ownAttributes = reference[EntityPropertyType.Attributes] || {}
            for (const attributeName in ownAttributes) {
                if (classification.representativeAttributeNames.has(attributeName)) {
                    representativeReferenceAttributes.set(attributeName, this.toSingleValue(this.wrapRawValueIntoNativeValue(ownAttributes[attributeName])))
                }
            }
        }

        const groupPrimaryKey: number | undefined =
            classification?.referenceSchema.referencedGroupTypeManaged === true
                ? reference['groupEntity']?.['primaryKey']
                : undefined

        return new EntityReferenceValue(
            referencedPrimaryKey,
            representativeAttributes,
            representativeReferenceAttributes.size > 0 ? representativeReferenceAttributes : undefined,
            targetRepresentativeAttributes.size > 0 ? targetRepresentativeAttributes : undefined,
            groupPrimaryKey
        )
    }
}
