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

const priceInPriceListsConstraintPattern = /priceInPriceLists\s*:\s*\[?\s*"[A-Za-z0-9_.\-~]+"/
const priceInCurrencyConstraintPattern = /priceInCurrency\s*:\s*[A-Z_]+/
const priceObjectFieldsTemplate =
    `
    {
        priceId
        priceList
        currency
        innerRecordId
        sellable
        validity
        priceWithoutTax
        priceWithTax
        taxRate
    }
    `

/**
 * Query builder for GraphQL language.
 */
export class GraphQLQueryBuilder implements QueryBuilder {
    private readonly labService: LabService

    constructor(labService: LabService) {
        this.labService = labService
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

        const headerArguments: string[] = []

        const filterByContainer: string[] = []
        if (filterBy.length > 0) {
            filterByContainer.push(filterBy)
        }
        if (dataLocale != undefined) {
            filterByContainer.push(`entityLocaleEquals: ${dataLocale}`)
        }
        if (filterByContainer.length > 0) {
            headerArguments.push(`filterBy: { ${filterByContainer.join(',')} }`)
        }

        if (orderBy.length > 0) {
            headerArguments.push(`orderBy: { ${orderBy} }`)
        }

        if (priceType != undefined) {
            headerArguments.push(`require: { priceType: ${priceType} }`)
        }

        const entityOutputFields: string[] = []
        this.buildEntityBodyProperties(requiredData, entitySchema, dataLocale, entityOutputFields)
        this.buildAttributesProperty(requiredData, entitySchema, dataPointer, dataLocale, entityOutputFields)
        this.buildAssociatedDataProperty(requiredData, entitySchema, dataPointer, dataLocale, entityOutputFields)
        this.buildPricesProperty(requiredData, filterBy, entityOutputFields)
        await this.buildReferenceProperties(requiredData, entitySchema, dataPointer, dataLocale, entityOutputFields)

        const queryHeader = headerArguments.length > 0 ? `(\n${headerArguments.join(", ")}\n)` : ''
        return `
        {
            q: query${entitySchema.nameVariants.pascalCase}${queryHeader} {
                recordPage(number: ${pageNumber}, size: ${pageSize}) {
                    data {
                        ${entityOutputFields.join("\n")}
                    }
                    totalRecordCount
                }
            }
        }
        `
    }

    private buildEntityBodyProperties(requiredData: EntityPropertyKey[],
                                      entitySchema: EntitySchema,
                                      dataLocale: string | undefined,
                                      entityOutputFields: string[]): void {
        requiredData
            .filter(({ type }) => type === EntityPropertyType.Entity)
            .map(({ name }) => name)
            .forEach(it => {
                if (it === StaticEntityProperties.ParentPrimaryKey) {
                    const representativeAttributes: AttributeSchemaUnion[] = Object.values(entitySchema.attributes)
                        .filter(attributeSchema => 'representative' in attributeSchema && attributeSchema.representative)
                        .filter(attributeSchema => {
                            if (!dataLocale) {
                                return !attributeSchema.localized
                            }
                            return true
                        })

                    if (representativeAttributes.length === 0) {
                        entityOutputFields.push(`parents(stopAt: { distance: 1 }) {`)
                        entityOutputFields.push('  primaryKey')
                        entityOutputFields.push('}')
                    } else {
                        entityOutputFields.push(`parents(stopAt: { distance: 1 }) {`)
                        entityOutputFields.push('   primaryKey')
                        entityOutputFields.push('   attributes {')
                        entityOutputFields.push(`       ${representativeAttributes.map(attributeSchema => `${attributeSchema.nameVariants.camelCase}`).join(',')}`)
                        entityOutputFields.push('   }')
                        entityOutputFields.push('}')
                    }
                } else {
                    entityOutputFields.push(it)
                }
            })
    }

    private buildAttributesProperty(requiredData: EntityPropertyKey[],
                                    entitySchema: EntitySchema,
                                    dataPointer: DataGridDataPointer,
                                    dataLocale: string | undefined,
                                    entityOutputFields: string[]) {
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
        if (requiredAttributes.length === 0) {
            return
        }

        if (dataLocale !== undefined) {
            entityOutputFields.push(`attributes(locale: ${dataLocale.replace('-', '_')}) {`)
        } else {
            entityOutputFields.push(`attributes {`)
        }
        requiredAttributes.forEach(requiredAttribute => entityOutputFields.push(requiredAttribute))
        entityOutputFields.push('}')
    }

    private buildAssociatedDataProperty(requiredData: EntityPropertyKey[],
                                        entitySchema: EntitySchema,
                                        dataPointer: DataGridDataPointer,
                                        dataLocale: string | undefined,
                                        entityOutputFields: string[]) {
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
        if (requiredAssociatedData.length === 0) {
            return
        }

        if (dataLocale !== undefined) {
            entityOutputFields.push(`associatedData(locale: ${dataLocale.replace('-', '_')}) {`)
        } else {
            entityOutputFields.push(`associatedData {`)
        }
        requiredAssociatedData.forEach(requiredAssociatedDatum => entityOutputFields.push(requiredAssociatedDatum))
        entityOutputFields.push('}')
    }

    private buildPricesProperty(requiredData: EntityPropertyKey[],
                                filterBy: string,
                                entityOutputFields: string[]): void {
        if (requiredData.find(({ type }) => type === EntityPropertyType.Prices) != undefined) {
            entityOutputFields.push(`prices ${priceObjectFieldsTemplate}`)

            const priceListDefined: boolean = priceInPriceListsConstraintPattern.exec(filterBy) != undefined
            const currencyDefined: boolean = priceInCurrencyConstraintPattern.exec(filterBy) != undefined
            if (priceListDefined && currencyDefined) {
                entityOutputFields.push(`priceForSale ${priceObjectFieldsTemplate}`)
            }
        }
    }

    private async buildReferenceProperties(requiredData: EntityPropertyKey[],
                                           entitySchema: EntitySchema,
                                           dataPointer: DataGridDataPointer,
                                           dataLocale: string | undefined,
                                           entityOutputFields: string[]) {
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
                    return attributeSchema.nameVariants.camelCase
                })
                .filter(it => it != undefined)
                .map(it => it as string)

            let requiredRepresentativeAttributes: string[] = []
            if (referenceSchema.referencedEntityTypeManaged) {
                requiredRepresentativeAttributes = this.findRepresentativeAttributes(
                    await this.labService.getEntitySchema(dataPointer.connection, dataPointer.catalogName, referenceSchema.referencedEntityType),
                    dataLocale
                )
                    .map(attributeSchema => attributeSchema.nameVariants.camelCase)
            }

            entityOutputFields.push(`reference_${requiredReference}: ${requiredReference} {`)
            entityOutputFields.push('   referencedPrimaryKey')
            if (referenceSchema.referencedEntityTypeManaged) {
                if (requiredAttributes.length > 0) {
                    entityOutputFields.push('   attributes {')
                    entityOutputFields.push(`       ${requiredAttributes.join(',')}`)
                    entityOutputFields.push('   }')
                }

                if (requiredRepresentativeAttributes.length > 0) {
                    entityOutputFields.push('   referencedEntity {')
                    entityOutputFields.push('       attributes {')
                    entityOutputFields.push(`           ${requiredRepresentativeAttributes.join(',')}`)
                    entityOutputFields.push('       }')
                    entityOutputFields.push('   }')
                }
            }
            entityOutputFields.push('}')
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
        return `entityPrimaryKeyNatural: ${orderDirection}`
    }

    buildAttributeOrderBy(attributeSchema: AttributeSchemaUnion, orderDirection: OrderDirection): string {
        return `attribute${attributeSchema.nameVariants.pascalCase}Natural: ${orderDirection}`
    }

    buildReferenceAttributeOrderBy(referenceSchema: ReferenceSchema, attributeSchema: AttributeSchemaUnion, orderDirection: OrderDirection): string {
        return `reference${referenceSchema.nameVariants.pascalCase}Property: { attribute${attributeSchema.nameVariants.pascalCase}Natural: ${orderDirection} }`
    }

    buildParentEntityFilterBy(parentPrimaryKey: number): string {
        return `entityPrimaryKeyInSet: ${parentPrimaryKey}`
    }

    buildPredecessorEntityFilterBy(predecessorPrimaryKey: number): string {
        return `entityPrimaryKeyInSet: ${predecessorPrimaryKey}`
    }

    buildReferencedEntityFilterBy(referencedPrimaryKeys: number | number[]): string {
        return `entityPrimaryKeyInSet: [${typeof referencedPrimaryKeys === 'number' ? referencedPrimaryKeys : referencedPrimaryKeys.join(', ')}]`
    }

    buildPriceForSaleFilterBy(entityPrimaryKey: number, priceLists: string[], currency: string): string {
        return `entityPrimaryKeyInSet: ${entityPrimaryKey}, priceInPriceLists: [${priceLists.map(it => `"${it}"`).join(',')}], priceInCurrency: "${currency}"`
    }
}
