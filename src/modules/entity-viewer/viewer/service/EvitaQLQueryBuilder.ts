import type { QueryBuilder } from '@/modules/entity-viewer/viewer/service/QueryBuilder'
import { StaticEntityProperties } from '@/modules/entity-viewer/viewer/model/StaticEntityProperties'
import { EntityViewerDataPointer } from '../model/EntityViewerDataPointer'
import { EntityPropertyKey } from '@/modules/entity-viewer/viewer/model/EntityPropertyKey'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { EntityPropertyType } from '@/modules/entity-viewer/viewer/model/EntityPropertyType'
import { AttributeSchema } from '@/modules/database-driver/request-response/schema/AttributeSchema'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { AssociatedDataSchema } from '@/modules/database-driver/request-response/schema/AssociatedDataSchema'
import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { QueryPriceMode } from '@/modules/entity-viewer/viewer/model/QueryPriceMode'
import { OrderDirection } from '@/modules/database-driver/request-response/schema/OrderDirection'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { SelectedScope } from '@/modules/entity-viewer/viewer/model/SelectedScope.ts'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'

/**
 * Query builder for EvitaQL language.
 */
export class EvitaQLQueryBuilder implements QueryBuilder {
    private readonly evitaClient: EvitaClient

    private readonly entityBodyProperties: Set<string> = new Set<string>()

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient

        this.entityBodyProperties.add(StaticEntityProperties.ParentPrimaryKey)
        this.entityBodyProperties.add(StaticEntityProperties.Locales)
        this.entityBodyProperties.add(StaticEntityProperties.PriceInnerRecordHandling)
    }

    async buildQuery(dataPointer: EntityViewerDataPointer,
                     filterBy: string,
                     orderBy: string,
                     selectedScope: SelectedScope[],
                     dataLocale: string | undefined,
                     priceType: QueryPriceMode | undefined,
                     requiredData: EntityPropertyKey[],
                     pageNumber: number,
                     pageSize: number): Promise<string> {
        const entitySchema: EntitySchema = await this.evitaClient.queryCatalog(
            dataPointer.catalogName,
            session =>
                session.getEntitySchemaOrThrowException(dataPointer.entityType)
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

        if(selectedScope.length > 0) {
            let allSelected: boolean = selectedScope.length > 1
            let nothingSelected: boolean = true
            for (const item of selectedScope) {
                if (!item.value) {
                    allSelected = false
                } else {
                    nothingSelected = false
                }
            }

            if(!nothingSelected) {
                filterByContainer.push(`scope(${selectedScope.some(x => x.scope === EntityScope.Live && x.value) ? 'LIVE' : ''} ${allSelected ? ',' : ''} ${selectedScope.some(x => x.scope === EntityScope.Archive && x.value) ? 'ARCHIVED' : ''})`)
            } else {
                return `query(collection("${dataPointer.entityType}"))`
            }
        } else {
            return `query(collection("${dataPointer.entityType}"))`
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
                    .find(attributeSchema => attributeSchema.name === it)
                if (attributeSchema == undefined) {
                    throw new UnexpectedError(`Could not find attribute '${it}' in '${dataPointer.entityType}' in connection '${dataPointer.connection.name}'.`)
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
                                             dataPointer: EntityViewerDataPointer,
                                             dataLocale: string | undefined,
                                             entityFetchRequires: string[]): void {
        const requiredAssociatedData: string[] = requiredData
            .filter(({ type }) => type === EntityPropertyType.AssociatedData)
            .map(({ name }) => name)
            .map(it => {
                const associatedDataSchema: AssociatedDataSchema | undefined = entitySchema.associatedData
                    .find(associatedDataSchema => associatedDataSchema.name === it)
                if (associatedDataSchema == undefined) {
                    throw new UnexpectedError(`Could not find associated data '${it}' in '${dataPointer.entityType}' in connection '${dataPointer.connection.name}'.`)
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
                .find(referenceSchema => referenceSchema.name === requiredReference)
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
                        .find(attributeSchema => attributeSchema.name === referenceAttribute)
                    if (attributeSchema == undefined) {
                        throw new UnexpectedError(`Could not find attribute '${referenceAttribute}' in reference '${requiredReference}' in '${dataPointer.entityType}' in connection '${dataPointer.connection.name}'.`)
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
                    await this.evitaClient.queryCatalog(
                        dataPointer.catalogName,
                        async session => await session.getEntitySchemaOrThrowException(referenceSchema.entityType)
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
        return Array.from(entitySchema.attributes.values() || [])
            .filter(attributeSchema => attributeSchema.representative)
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
