import { QueryBuilder } from '@/modules/entity-viewer/viewer/service/QueryBuilder'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { EntityViewerDataPointer } from '../model/EntityViewerDataPointer'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { AttributeSchema } from '@/modules/connection/model/schema/AttributeSchema'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { NamingConvention } from '@/modules/connection/model/NamingConvetion'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { AssociatedDataSchema } from '@/modules/connection/model/schema/AssociatedDataSchema'
import { ReferenceSchema } from '@/modules/connection/model/schema/ReferenceSchema'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'
import { OrderDirection } from '@/modules/connection/model/schema/OrderDirection'

/**
 * Query builder for EvitaQL language.
 */
export class EvitaQLQueryBuilder implements QueryBuilder {
    private readonly connectionService: ConnectionService

    private readonly entityBodyProperties: Set<string> = new Set<string>()

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService

        this.entityBodyProperties.add(StaticEntityProperties.ParentPrimaryKey)
        this.entityBodyProperties.add(StaticEntityProperties.Locales)
        this.entityBodyProperties.add(StaticEntityProperties.PriceInnerRecordHandling)
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
                                         dataPointer: EntityViewerDataPointer,
                                         dataLocale: string | undefined,
                                         entityFetchRequires: string[]) {
        const requiredAttributes: string[] = requiredData
            .filter(({ type }) => type === EntityPropertyType.Attributes)
            .map(({ name }) => name)
            .map(it => {
                const attributeSchema: AttributeSchema | undefined = entitySchema.attributes
                    .getIfSupported()
                    ?.find(attributeSchema => attributeSchema.nameVariants
                        .getIfSupported()
                        ?.get(NamingConvention.CamelCase) === it)
                if (attributeSchema == undefined) {
                    throw new UnexpectedError(`Could not find attribute '${it}' in '${dataPointer.entityType}' in connection '${dataPointer.connection.name}'.`)
                }
                if (!dataLocale && attributeSchema.localized.getOrElse(false)) {
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
                                             dataPointer: EntityViewerDataPointer,
                                             dataLocale: string | undefined,
                                             entityFetchRequires: string[]): void {
        const requiredAssociatedData: string[] = requiredData
            .filter(({ type }) => type === EntityPropertyType.AssociatedData)
            .map(({ name }) => name)
            .map(it => {
                const associatedDataSchema: AssociatedDataSchema | undefined = entitySchema.associatedData
                    .getIfSupported()
                    ?.find(associatedDataSchema => associatedDataSchema.nameVariants
                        .getIfSupported()
                        ?.get(NamingConvention.CamelCase) === it)
                if (associatedDataSchema == undefined) {
                    throw new UnexpectedError(`Could not find associated data '${it}' in '${dataPointer.entityType}' in connection '${dataPointer.connection.name}'.`)
                }
                if (!dataLocale && associatedDataSchema.localized.getOrElse(false)) {
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
                                               dataPointer: EntityViewerDataPointer,
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
            const referenceSchema: ReferenceSchema | undefined = entitySchema.references
                .getIfSupported()
                ?.find(referenceSchema => referenceSchema.nameVariants
                    .getIfSupported()
                    ?.get(NamingConvention.CamelCase) === requiredReference)
            if (referenceSchema == undefined) {
                throw new UnexpectedError(`Could not find reference '${requiredReference}' in '${dataPointer.entityType}' in connection '${dataPointer.connection.name}'.`)
            }

            const requiredAttributes: string[] = requiredData
                .filter(({ type }) => type === EntityPropertyType.ReferenceAttributes)
                .map(({ names }) => names)
                .filter(names => names[0] === requiredReference)
                .map(names => names[1])
                .map(referenceAttribute => {
                    const attributeSchema: AttributeSchema | undefined = referenceSchema.attributes
                        .getIfSupported()
                        ?.find(attributeSchema => attributeSchema.nameVariants
                            .getIfSupported()
                            ?.get(NamingConvention.CamelCase) === referenceAttribute)
                    if (attributeSchema == undefined) {
                        throw new UnexpectedError(`Could not find attribute '${referenceAttribute}' in reference '${requiredReference}' in '${dataPointer.entityType}' in connection '${dataPointer.connection.name}'.`)
                    }
                    if (!dataLocale && attributeSchema.localized.getOrElse(false)) {
                        // we don't want try to fetch localized attributes when no locale is specified, that would throw an error in evitaDB
                        return undefined
                    }
                    return attributeSchema.name
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

    private findRepresentativeAttributes(entitySchema: EntitySchema, dataLocale: string | undefined): AttributeSchema[] {
        return Array.from(entitySchema.attributes.getIfSupported()?.values() || [])
            .filter(attributeSchema => attributeSchema.representative.getOrElse(false))
            .filter(attributeSchema => {
                if (!dataLocale) {
                    return !attributeSchema.localized.getOrElse(false)
                }
                return true
            })
    }

    buildPrimaryKeyOrderBy(orderDirection: OrderDirection): string {
        return `entityPrimaryKeyNatural(${orderDirection})`
    }

    buildAttributeOrderBy(attributeSchema: AttributeSchema, orderDirection: OrderDirection): string {
        return `attributeNatural("${attributeSchema.name}", ${orderDirection})`
    }

    buildReferenceAttributeOrderBy(referenceSchema: ReferenceSchema, attributeSchema: AttributeSchema, orderDirection: OrderDirection): string {
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
