import { QueryBuilder } from '@/services/editor/data-grid/query-builder'
import { LabService } from '@/services/lab.service'
import {
    AssociatedDataSchema,
    AttributeSchemaUnion,
    EntitySchema, OrderDirection,
    QueryPriceMode,
    ReferenceSchema
} from '@/model/evitadb'
import { UnexpectedError } from '@/model/lab'
import {
    DataGridDataPointer,
    EntityPropertyKey,
    EntityPropertyType,
    StaticEntityProperties
} from '@/model/editor/tab/dataGrid/data-grid'

/**
 * Query builder for EvitaQL language.
 */
export class EvitaQLQueryBuilder implements QueryBuilder {
    private readonly labService: LabService

    private readonly entityBodyProperties: Set<string> = new Set<string>()

    constructor(labService: LabService) {
        this.labService = labService

        this.entityBodyProperties.add(StaticEntityProperties.ParentPrimaryKey)
        this.entityBodyProperties.add(StaticEntityProperties.Locales)
        this.entityBodyProperties.add(StaticEntityProperties.AllLocales)
        this.entityBodyProperties.add(StaticEntityProperties.PriceInnerRecordHandling)
    }

    async buildQuery(dataPointer: DataGridDataPointer,
                     filterBy: string,
                     orderBy: string,
                     dataLocale: string | undefined,
                     priceType: QueryPriceMode | undefined,
                     requiredData: EntityPropertyKey[],
                     pageNumber: number,
                     pageSize: number): Promise<string> {
        const entitySchema: EntitySchema = await this.labService.getEntitySchema(dataPointer.connection, dataPointer.catalogName, dataPointer.entityType)

        const constraints: string[] = []

        constraints.push(`collection("${dataPointer.entityType}")`)

        const filterByContainer: string[] = []
        if (filterBy) {
            filterByContainer.push(filterBy)
        }
        if (dataLocale) {
            filterByContainer.push(`entityLocaleEquals("${dataLocale}")`)
        }
        if (filterByContainer.length > 0) {
            constraints.push(`filterBy(${filterByContainer.join(',')})`)
        }

        if (orderBy) {
            constraints.push(`orderBy(${orderBy})`)
        }

        const requireConstraints: string[] = []
        requireConstraints.push(`page(${pageNumber}, ${pageSize})`)

        const entityFetchRequires: string[] = []
        this.buildEntityBodyFetchRequires(requiredData, entitySchema, dataLocale, entityFetchRequires)
        this.buildAttributesFetchRequires(requiredData, entitySchema, dataPointer, dataLocale, entityFetchRequires)
        this.buildAssociatedDataFetchRequires(requiredData, entitySchema, dataPointer, dataLocale, entityFetchRequires)
        this.buildPriceFetchRequires(requiredData, entityFetchRequires)
        await this.buildReferencesFetchRequires(requiredData, entitySchema, dataPointer, dataLocale, entityFetchRequires)
        if (entityFetchRequires.length > 0 ||
            requiredData.findIndex(propertyKey => this.entityBodyProperties.has(propertyKey.toString())) > -1) {
            requireConstraints.push(`entityFetch(${entityFetchRequires.join(',')})`)
        }

        if (priceType != undefined) {
            requireConstraints.push(`priceType(${priceType})`)
        }

        if (requireConstraints.length > 0) {
            constraints.push(`require(${requireConstraints.join(',')})`)
        }

        return `query(${constraints.join(',')})`
    }

    private buildEntityBodyFetchRequires(requiredData: EntityPropertyKey[],
                                         entitySchema: EntitySchema,
                                         dataLocale: string | undefined,
                                         entityFetchRequires: string[]): void {
        requiredData
            .filter(({ type }) => type === EntityPropertyType.Entity)
            .map(({ name }) => name)
            .forEach(it => {
                if (it === StaticEntityProperties.ParentPrimaryKey) {
                    const requiredRepresentativeAttributes: string[] = this.findRepresentativeAttributes(entitySchema, dataLocale)
                        .map(attributeSchema => attributeSchema.name)

                    let hierarchyContentConstraintBuilder: string = 'hierarchyContent(stopAt(distance(1))'
                    if (requiredRepresentativeAttributes.length > 0) {
                        hierarchyContentConstraintBuilder += `,entityFetch(attributeContent(${requiredRepresentativeAttributes.map(it => `"${it}"`).join(',')}))`
                    }
                    hierarchyContentConstraintBuilder += ')'
                    entityFetchRequires.push(hierarchyContentConstraintBuilder)
                }
            })
    }

    private buildAttributesFetchRequires(requiredData: EntityPropertyKey[],
                                         entitySchema: EntitySchema,
                                         dataPointer: DataGridDataPointer,
                                         dataLocale: string | undefined,
                                         entityFetchRequires: string[]) {
        const requiredAttributes: string[] = requiredData
            .filter(({ type }) => type === EntityPropertyType.Attributes)
            .map(({ name }) => name)
            .map(it => {
                const attributeSchema: AttributeSchemaUnion | undefined = Object.values(entitySchema.attributes)
                    .find(attributeSchema => attributeSchema.nameVariants.camelCase === it)
                if (attributeSchema == undefined) {
                    throw new UnexpectedError(dataPointer.connection, `Could not find attribute '${it}' in '${dataPointer.entityType}'.`)
                }
                if (!dataLocale && attributeSchema.localized) {
                    // we don't want try to fetch localized attributes when no locale is specified, that would throw an error in evitaDB
                    return undefined
                }
                return attributeSchema.name
            })
            .filter(it => it != undefined)
            .map(it => it as string)

        if (requiredAttributes.length > 0) {
            entityFetchRequires.push(`attributeContent(${requiredAttributes.map(it => `"${it}"`).join(',')})`)
        }
    }

    private buildAssociatedDataFetchRequires(requiredData: EntityPropertyKey[],
                                             entitySchema: EntitySchema,
                                             dataPointer: DataGridDataPointer,
                                             dataLocale: string | undefined,
                                             entityFetchRequires: string[]) {
        const requiredAssociatedData: string[] = requiredData
            .filter(({ type }) => type === EntityPropertyType.AssociatedData)
            .map(({ name }) => name)
            .map(it => {
                const associatedDataSchema: AssociatedDataSchema | undefined = Object.values(entitySchema.associatedData)
                    .find(associatedDataSchema => associatedDataSchema.nameVariants.camelCase === it)
                if (associatedDataSchema == undefined) {
                    throw new UnexpectedError(dataPointer.connection, `Could not find associated data '${it}' in '${dataPointer.entityType}'.`)
                }
                if (!dataLocale && associatedDataSchema.localized) {
                    // we don't want try to fetch localized associated data when no locale is specified, that would throw an error in evitaDB
                    return undefined
                }
                return associatedDataSchema.name
            })
            .filter(it => it != undefined)
            .map(it => it as string)

        if (requiredAssociatedData.length > 0) {
            entityFetchRequires.push(`associatedDataContent(${requiredAssociatedData.map(it => `"${it}"`).join(',')})`)
        }
    }

    private buildPriceFetchRequires(requiredData: EntityPropertyKey[], entityFetchRequires: string[]): void {
        if (requiredData.find(({ type }) => type === EntityPropertyType.Prices) != undefined) {
            entityFetchRequires.push('priceContentAll()')
        } else if (requiredData.find(it => it.type === EntityPropertyType.Entity && it.name === StaticEntityProperties.PriceInnerRecordHandling) != undefined) {
            entityFetchRequires.push('priceContentRespectingFilter()')
        }
    }

    private async buildReferencesFetchRequires(requiredData: EntityPropertyKey[],
                                               entitySchema: EntitySchema,
                                               dataPointer: DataGridDataPointer,
                                               dataLocale: string | undefined,
                                               entityFetchRequires: string[]) {
        const requiredReferences: string[] = []
        for (const requiredDatum of requiredData) {
            if (requiredDatum.type === EntityPropertyType.References) {
                const referenceName = requiredDatum.name
                if (!requiredReferences.includes(referenceName)) {
                    requiredReferences.push(referenceName)
                }
            } else if (requiredDatum.type === EntityPropertyType.ReferenceAttributes) {
                const referenceName = requiredDatum.names[0]
                if (!requiredReferences.includes(referenceName)) {
                    requiredReferences.push(referenceName)
                }
            }
        }
        if (requiredReferences.length === 0) {
            return
        }

        for (const requiredReference of requiredReferences) {
            const referenceSchema: ReferenceSchema | undefined = Object.values(entitySchema.references)
                .find(referenceSchema => referenceSchema.nameVariants.camelCase === requiredReference)
            if (referenceSchema == undefined) {
                throw new UnexpectedError(undefined, `Could not find reference '${requiredReference}' in '${dataPointer.entityType}'.`)
            }

            const requiredAttributes: string[] = requiredData
                .filter(({ type }) => type === EntityPropertyType.ReferenceAttributes)
                .map(({ names }) => names)
                .filter(names => names[0] === requiredReference)
                .map(names => names[1])
                .map(referenceAttribute => {
                    const attributeSchema: AttributeSchemaUnion | undefined = Object.values(referenceSchema.attributes)
                        .find(attributeSchema => attributeSchema.nameVariants.camelCase === referenceAttribute)
                    if (attributeSchema == undefined) {
                        throw new UnexpectedError(dataPointer.connection, `Could not find attribute '${referenceAttribute}' in reference '${requiredReference}' in '${dataPointer.entityType}'.`)
                    }
                    if (!dataLocale && attributeSchema.localized) {
                        // we don't want try to fetch localized attributes when no locale is specified, that would throw an error in evitaDB
                        return undefined
                    }
                    return attributeSchema.name
                })
                .filter(it => it != undefined)
                .map(it => it as string)

            let requiredRepresentativeAttributes: string[] = []
            if (referenceSchema.referencedEntityTypeManaged) {
                requiredRepresentativeAttributes = this.findRepresentativeAttributes(
                    await this.labService.getEntitySchema(dataPointer.connection, dataPointer.catalogName, referenceSchema.referencedEntityType),
                    dataLocale
                )
                    .map(attributeSchema => attributeSchema.name)
            }

            let referenceContentConstraintBuilder: string = 'referenceContent'
            if (requiredAttributes.length > 0) {
                referenceContentConstraintBuilder += `WithAttributes`
            }
            referenceContentConstraintBuilder += `("${referenceSchema.name}"`
            if (requiredAttributes.length > 0) {
                referenceContentConstraintBuilder += `,attributeContent(${requiredAttributes.map(it => `"${it}"`).join(',')})`
            }
            if (requiredRepresentativeAttributes.length > 0) {
                referenceContentConstraintBuilder += `,entityFetch(attributeContent(${requiredRepresentativeAttributes.map(it => `"${it}"`).join(',')}))`
            }
            referenceContentConstraintBuilder += ')'

            entityFetchRequires.push(referenceContentConstraintBuilder)
        }
    }

    private findRepresentativeAttributes(entitySchema: EntitySchema, dataLocale: string | undefined): AttributeSchemaUnion[] {
        return Object.values(entitySchema.attributes)
            .filter(attributeSchema => 'representative' in attributeSchema && attributeSchema.representative)
            .filter(attributeSchema => {
                if (!dataLocale) {
                    return !attributeSchema.localized
                }
                return true
            })
    }

    buildPrimaryKeyOrderBy(orderDirection: OrderDirection): string {
        return `entityPrimaryKeyNatural(${orderDirection})`
    }

    buildAttributeOrderBy(attributeSchema: AttributeSchemaUnion, orderDirection: OrderDirection): string {
        return `attributeNatural("${attributeSchema.name}", ${orderDirection})`
    }

    buildReferenceAttributeOrderBy(referenceSchema: ReferenceSchema, attributeSchema: AttributeSchemaUnion, orderDirection: OrderDirection): string {
        return `referenceProperty("${referenceSchema.name}", attributeNatural("${attributeSchema.name}", ${orderDirection}))`
    }

    buildParentEntityFilterBy(parentPrimaryKey: number): string {
        return `entityPrimaryKeyInSet(${parentPrimaryKey})`
    }

    buildPredecessorEntityFilterBy(predecessorPrimaryKey: number): string {
        return `entityPrimaryKeyInSet(${predecessorPrimaryKey})`
    }

    buildReferencedEntityFilterBy(referencedPrimaryKeys: number | number[]): string {
        return `entityPrimaryKeyInSet(${typeof referencedPrimaryKeys === 'number' ? referencedPrimaryKeys : referencedPrimaryKeys.join(', ')})`
    }

    buildPriceForSaleFilterBy(entityPrimaryKey: number, priceLists: string[], currency: string): string {
        return `and(entityPrimaryKeyInSet(${entityPrimaryKey}),priceInPriceLists(${priceLists.map(it => `"${it}"`).join(',')}),priceInCurrency("${currency}"))`
    }
}
