import { QueryBuilder } from '@/modules/entity-viewer/viewer/service/QueryBuilder'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { EntityViewerDataPointer } from '@/modules/entity-viewer/viewer/model/EntityViewerDataPointer'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { OrderDirection } from '@/modules/connection/model/schema/OrderDirection'
import { AttributeSchema } from '@/modules/connection/model/schema/AttributeSchema'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'
import { NamingConvention } from '@/modules/connection/model/NamingConvetion'
import { AssociatedDataSchema } from '@/modules/connection/model/schema/AssociatedDataSchema'

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
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    async buildQuery(dataPointer: EntityViewerDataPointer,
                     filterBy: string,
                     orderBy: string,
                     dataLocale: string | undefined,
                     priceType: QueryPriceMode | undefined,
                     requiredData: EntityPropertyKey[],
                     pageNumber: number,
                     pageSize: number): Promise<string> {
        const entitySchema: EntitySchema = await this.connectionService.getEntitySchema(
            dataPointer.connection,
            dataPointer.catalogName,
            dataPointer.entityType
        )

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
            q: query${entitySchema.nameVariants.getIfSupported()?.get(NamingConvention.PascalCase)}${queryHeader} {
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
                    const representativeAttributes: AttributeSchema[] = Array.from(
                        entitySchema.attributes
                            .getIfSupported()
                            ?.values() || []
                    )
                        .filter(attributeSchema => attributeSchema.representative.getOrElse(false))
                        .filter(attributeSchema => {
                            if (!dataLocale) {
                                return !attributeSchema.localized.getOrElse(false)
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
                        entityOutputFields.push(`       ${representativeAttributes.map(attributeSchema => `${attributeSchema.nameVariants.getIfSupported()?.get(NamingConvention.CamelCase)}`).join(',')}`)
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
                                    dataPointer: EntityViewerDataPointer,
                                    dataLocale: string | undefined,
                                    entityOutputFields: string[]): void {
        const requiredAttributes: string[] = requiredData
            .filter(({ type }) => type === EntityPropertyType.Attributes)
            .map(({ name }) => name)
            .map(it => {
                const attributeSchema: AttributeSchema | undefined = entitySchema.attributes
                    .getIfSupported()
                    ?.find(attributeSchema => attributeSchema.name === it)
                if (attributeSchema == undefined) {
                    throw new UnexpectedError(`Could not find attribute '${it}' in '${dataPointer.entityType}'.`)
                }
                if (!dataLocale && attributeSchema.localized.getOrElse(false)) {
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
                                        dataPointer: EntityViewerDataPointer,
                                        dataLocale: string | undefined,
                                        entityOutputFields: string[]): void {
        const requiredAssociatedData: string[] = requiredData
            .filter(({ type }) => type === EntityPropertyType.AssociatedData)
            .map(({ name }) => name)
            .map(it => {
                const associatedDataSchema: AssociatedDataSchema | undefined = entitySchema.associatedData
                    .getIfSupported()
                    ?.find(associatedDataSchema => associatedDataSchema.name === it)
                if (associatedDataSchema == undefined) {
                    throw new UnexpectedError(`Could not find associated data '${it}' in '${dataPointer.entityType}'.`)
                }
                if (!dataLocale && associatedDataSchema.localized.getOrElse(false)) {
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
                                           dataPointer: EntityViewerDataPointer,
                                           dataLocale: string | undefined,
                                           entityOutputFields: string[]): Promise<void> {
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
            const referenceSchema: ReferenceSchema | undefined = entitySchema.references
                .getIfSupported()
                ?.find(referenceSchema => referenceSchema.name === requiredReference)
            if (referenceSchema == undefined) {
                throw new UnexpectedError(`Could not find reference '${requiredReference}' in '${dataPointer.entityType}'.`)
            }

            const requiredAttributes: string[] = requiredData
                .filter(({ type }) => type === EntityPropertyType.ReferenceAttributes)
                .map(({ names }) => names)
                .filter(names => names[0] === requiredReference)
                .map(names => names[1])
                .map(referenceAttribute => {
                    const attributeSchema: AttributeSchema | undefined = referenceSchema.attributes
                        .getIfSupported()
                        ?.find(attributeSchema => attributeSchema.name === referenceAttribute)
                    if (attributeSchema == undefined) {
                        throw new UnexpectedError(`Could not find attribute '${referenceAttribute}' in reference '${requiredReference}' in '${dataPointer.entityType}'.`)
                    }
                    if (!dataLocale && attributeSchema.localized.getOrElse(false)) {
                        // we don't want try to fetch localized attributes when no locale is specified, that would throw an error in evitaDB
                        return undefined
                    }
                    return attributeSchema.nameVariants
                        .getIfSupported()
                        ?.get(NamingConvention.CamelCase)
                })
                .filter(it => it != undefined)
                .map(it => it as string)

            let requiredRepresentativeAttributes: string[] = []
            if (referenceSchema.referencedEntityTypeManaged.getOrElse(false)) {
                requiredRepresentativeAttributes = this.findRepresentativeAttributes(
                    await this.connectionService.getEntitySchema(
                        dataPointer.connection,
                        dataPointer.catalogName,
                        referenceSchema.entityType.getIfSupported()!
                    ),
                    dataLocale
                )
                    .map(attributeSchema => attributeSchema.nameVariants
                        .getIfSupported()
                        ?.get(NamingConvention.CamelCase)!)
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

    private findRepresentativeAttributes(entitySchema: EntitySchema, dataLocale: string | undefined): AttributeSchema[] {
        return Array.from(
            entitySchema.attributes
                .getIfSupported()
                ?.values() || []
        )
            .filter(attributeSchema => attributeSchema.representative.getOrElse(false))
            .filter(attributeSchema => {
                if (!dataLocale) {
                    return !attributeSchema.localized.getOrElse(false)
                }
                return true
            })
    }

    buildPrimaryKeyOrderBy(orderDirection: OrderDirection): string {
        return `entityPrimaryKeyNatural: ${orderDirection}`
    }

    buildAttributeOrderBy(attributeSchema: AttributeSchema, orderDirection: OrderDirection): string {
        return `attribute${attributeSchema.nameVariants.getIfSupported()?.get(NamingConvention.PascalCase)}Natural: ${orderDirection}`
    }

    buildReferenceAttributeOrderBy(referenceSchema: ReferenceSchema, attributeSchema: AttributeSchema, orderDirection: OrderDirection): string {
        return `reference${referenceSchema.nameVariants.getIfSupported()?.get(NamingConvention.PascalCase)}Property: { attribute${attributeSchema.nameVariants.getIfSupported()?.get(NamingConvention.PascalCase)}Natural: ${orderDirection} }`
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
