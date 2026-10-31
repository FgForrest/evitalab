import { QueryExecutor } from '@/modules/entity-viewer/viewer/service/QueryExecutor'
import type { ReferenceClassification } from '@/modules/entity-viewer/viewer/service/QueryExecutor'
import type { GraphQLResultNode } from '@/modules/database-driver/connector/gql/model/GraphQLResultNode'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import type { QueryResult } from '@/modules/entity-viewer/viewer/model/QueryResult'
import type { FlatEntity } from '@/modules/entity-viewer/viewer/model/FlatEntity'
import type { WritableEntityProperty } from '@/modules/entity-viewer/viewer/model/WritableEntityProperty'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { allLocalesField, StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
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
import { QueryError } from '@/modules/database-driver/exception/QueryError'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import type { AssociatedDataSchema } from '@/modules/database-driver/request-response/schema/AssociatedDataSchema'
import type { EvitaValue } from '@/modules/database-driver/data-type/EvitaValue'
import { GraphQLValueConverter } from '@/modules/entity-viewer/viewer/service/GraphQLValueConverter'
import type { Map as ImmutableMap } from 'immutable'

/**
 * Schemas the values of a GraphQL response are converted by.
 */
type GraphQLResponseSchemas = {
    entitySchema: EntitySchema
    /**
     * Schemas of the entities referenced by the requested managed references, by reference name.
     */
    referencedEntitySchemas: Map<string, EntitySchema>
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

    async executeQuery(dataPointer: EntityViewerDataPointer, query: string, requiredData: EntityPropertyKey[]): Promise<QueryResult> {
        const result = await this.evitaClient.queryCatalogUsingGraphQL(
            dataPointer.catalogName,
            GraphQLInstanceType.Data,
            query
        )
        if (result.errors) {
            throw new QueryError(result.errors)
        }

        const schemas: GraphQLResponseSchemas = await this.evitaClient.queryCatalog(
            dataPointer.catalogName,
            async session => {
                const entitySchema: EntitySchema = await session.getEntitySchemaOrThrowException(dataPointer.entityType)
                const referencedEntitySchemas: Map<string, EntitySchema> = new Map<string, EntitySchema>()
                for (const referenceName of this.collectRequiredReferenceNames(requiredData)) {
                    const referenceSchema: ReferenceSchema | undefined = entitySchema.references
                        .find(schema => schema.name === referenceName)
                    if (referenceSchema != undefined && referenceSchema.referencedEntityTypeManaged) {
                        referencedEntitySchemas.set(
                            referenceName,
                            await session.getEntitySchemaOrThrowException(referenceSchema.entityType)
                        )
                    }
                }
                return { entitySchema, referencedEntitySchemas }
            }
        )
        const referenceClassifications: Map<string, ReferenceClassification> = this.buildReferenceClassifications(
            schemas.entitySchema,
            requiredData,
            attribute => attribute.nameVariants.get(NamingConvention.CamelCase)!
        )

        return {
            entities: result?.data?.q?.recordPage?.data.map((entity: GraphQLResultNode) => this.flattenEntity(entity, schemas, referenceClassifications)) || [],
            totalEntitiesCount: result?.data?.q?.recordPage?.totalRecordCount || 0
        }
    }

    private collectRequiredReferenceNames(requiredData: EntityPropertyKey[]): Set<string> {
        const referenceNames: Set<string> = new Set<string>()
        for (const key of requiredData) {
            if (key.type === EntityPropertyType.References || key.type === EntityPropertyType.ReferenceAttributes) {
                const referenceName: string | undefined = key.names[0]
                if (referenceName != undefined) {
                    referenceNames.add(referenceName)
                }
            }
        }
        return referenceNames
    }

    /**
     * Converts original rich entity into simplified flat entity that is displayable in table. Values are converted
     * into the driver's data types by the schema found under the response key (see {@link GraphQLValueConverter});
     * a value whose schema cannot be found stays as it was sent.
     */
    private flattenEntity(entity: GraphQLResultNode,
                          schemas: GraphQLResponseSchemas,
                          referenceClassifications: Map<string, ReferenceClassification>): FlatEntity {
        const flattenedProperties: (WritableEntityProperty | undefined)[] = []

        flattenedProperties.push([EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.PrimaryKey])])
        flattenedProperties.push([EntityPropertyKey.entity(StaticEntityProperties.Version), this.wrapRawValueIntoNativeValue(entity[StaticEntityProperties.Version])])
        flattenedProperties.push([EntityPropertyKey.entity(StaticEntityProperties.Scope), new NativeValue(GraphQLValueConverter.convertEntityScope(entity[StaticEntityProperties.Scope]))])
        flattenedProperties.push(this.flattenParent(entity, schemas.entitySchema))
        flattenedProperties.push([EntityPropertyKey.entity(StaticEntityProperties.Locales), this.wrapRawValueIntoNativeValue(GraphQLValueConverter.convertLocaleEnumArray(entity[allLocalesField]))])
        flattenedProperties.push([EntityPropertyKey.entity(StaticEntityProperties.PriceInnerRecordHandling), new NativeValue(GraphQLValueConverter.convertPriceInnerRecordHandling(entity[StaticEntityProperties.PriceInnerRecordHandling]))])

        flattenedProperties.push(...this.flattenAttributes(entity, schemas.entitySchema))
        flattenedProperties.push(...this.flattenAssociatedData(entity, schemas.entitySchema))
        flattenedProperties.push(this.flattenPrices(entity))
        flattenedProperties.push(...this.flattenReferences(entity, referenceClassifications, schemas.referencedEntitySchemas))

        return this.createFlatEntity(flattenedProperties)
    }

    /**
     * Converts a wire value by the type of its schema and wraps it.
     */
    private convertAndWrap(raw: EvitaValue, schema: AttributeSchema | AssociatedDataSchema | undefined): NativeValue | NativeValue[] {
        return this.wrapRawValueIntoNativeValue(GraphQLValueConverter.convertValue(raw, schema?.type))
    }

    /**
     * Finds an attribute or associated data schema by the camelCase name GraphQL uses as the response key.
     */
    private findAttributeByCamelCaseName<S extends AttributeSchema | AssociatedDataSchema>(attributes: ImmutableMap<string, S> | undefined,
                                                                                           camelCaseName: string): S | undefined {
        return attributes?.find(attribute => attribute.nameVariants.get(NamingConvention.CamelCase) === camelCaseName)
    }

    private flattenParent(entity: GraphQLResultNode, entitySchema: EntitySchema): WritableEntityProperty | undefined {
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
            representativeAttributes.push(this.convertAndWrap(
                attributes[attributeName],
                this.findAttributeByCamelCaseName(entitySchema.attributes, attributeName)
            ))
        }

        const parentReference: EntityReferenceValue = new EntityReferenceValue(parentPrimaryKey, representativeAttributes.flat())
        return [EntityPropertyKey.entity(StaticEntityProperties.ParentPrimaryKey), parentReference]
    }

    private flattenAttributes(entity: GraphQLResultNode, entitySchema: EntitySchema): WritableEntityProperty[] {
        const flattenedAttributes: WritableEntityProperty[] = []

        const attributes = entity[EntityPropertyType.Attributes] || {}
        for (const attributeName in attributes) {
            if (attributes[attributeName] == undefined) {
                // GraphQL sends a missing value as `null`, gRPC omits it; keep it absent like the evitaQL path does
                continue
            }
            const attributeSchema: AttributeSchema | undefined = this.findAttributeByCamelCaseName(entitySchema.attributes, attributeName)
            flattenedAttributes.push([
                EntityPropertyKey.attributes(attributeSchema?.name ?? attributeName),
                this.convertAndWrap(attributes[attributeName], attributeSchema)
            ])
        }

        return flattenedAttributes
    }

    private flattenAssociatedData(entity: GraphQLResultNode, entitySchema: EntitySchema): WritableEntityProperty[] {
        const flattenedAssociatedData: WritableEntityProperty[] = []

        const associatedData = entity[EntityPropertyType.AssociatedData] || {}
        for (const associatedDataName in associatedData) {
            if (associatedData[associatedDataName] == undefined) {
                continue
            }
            const associatedDataSchema: AssociatedDataSchema | undefined = this.findAttributeByCamelCaseName(entitySchema.associatedData, associatedDataName)
            flattenedAssociatedData.push([
                EntityPropertyKey.associatedData(associatedDataSchema?.name ?? associatedDataName),
                this.convertAndWrap(associatedData[associatedDataName], associatedDataSchema)
            ])
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
            priceForSale != undefined ? GraphQLValueConverter.convertPrice(priceForSale) : undefined,
            prices?.map(it => GraphQLValueConverter.convertPrice(it)) || []
        )
        return [EntityPropertyKey.prices(), entityPrices]
    }

    private flattenReferences(entity: GraphQLResultNode,
                              referenceClassifications: Map<string, ReferenceClassification>,
                              referencedEntitySchemas: Map<string, EntitySchema>): WritableEntityProperty[] {
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
                .map(referenceNode => this.buildReferenceValue(referenceNode, classification, referencedEntitySchemas.get(referenceName)))

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
                        const wrappedValue: NativeValue | NativeValue[] = this.convertAndWrap(
                            attributes[attributeName],
                            this.findAttributeByCamelCaseName(classification.referenceSchema.attributes, attributeName)
                        )
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
    private buildReferenceValue(reference: GraphQLResultNode,
                                classification: ReferenceClassification | undefined,
                                referencedEntitySchema: EntitySchema | undefined): EntityReferenceValue {
        const referencedPrimaryKey: number = reference['referencedPrimaryKey']

        const representativeAttributes: EntityPropertyValue[] = []
        const targetRepresentativeAttributes: Map<string, EntityPropertyValue> = new Map<string, EntityPropertyValue>()
        const targetAttributes = reference['referencedEntity']?.[EntityPropertyType.Attributes] || {}
        for (const attributeName in targetAttributes) {
            const wrappedValue: NativeValue | NativeValue[] = this.convertAndWrap(
                targetAttributes[attributeName],
                this.findAttributeByCamelCaseName(referencedEntitySchema?.attributes, attributeName)
            )
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
                    representativeReferenceAttributes.set(attributeName, this.toSingleValue(this.convertAndWrap(
                        ownAttributes[attributeName],
                        this.findAttributeByCamelCaseName(classification.referenceSchema.attributes, attributeName)
                    )))
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
