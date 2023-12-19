import { QueryBuilder } from '@/services/editor/data-grid/query-builder'
import {
    DataGridDataPointer,
    EntityPropertyKey,
    EntityPropertyType,
    StaticEntityProperties
} from '@/model/editor/data-grid'
import { LabService } from '@/services/lab.service'
import { AssociatedDataSchema, AttributeSchemaUnion, EntitySchema, ReferenceSchema } from '@/model/evitadb'
import { UnexpectedError } from '@/model/lab'

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
                     requiredProperties: EntityPropertyKey[],
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
        this.buildEntityBodyFetchRequires(requiredProperties, entitySchema, dataLocale, entityFetchRequires)
        this.buildAttributesFetchRequires(requiredProperties, entitySchema, dataPointer, entityFetchRequires)
        this.buildAssociatedDataFetchRequires(requiredProperties, entitySchema, dataPointer, entityFetchRequires)
        await this.buildReferencesFetchRequires(requiredProperties, entitySchema, dataPointer, dataLocale, entityFetchRequires)
        if (entityFetchRequires.length > 0 ||
            requiredProperties.findIndex(propertyKey => this.entityBodyProperties.has(propertyKey.toString())) > -1) {
            requireConstraints.push(`entityFetch(${entityFetchRequires.join(',')})`)
        }

        if (requireConstraints.length > 0) {
            constraints.push(`require(${requireConstraints.join(',')})`)
        }

        return `query(${constraints.join(',')})`
    }

    private buildEntityBodyFetchRequires(requiredProperties: EntityPropertyKey[],
                                         entitySchema: EntitySchema,
                                         dataLocale: string | undefined,
                                         entityFetchRequires: string[]): void {
        requiredProperties
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
                } else if (it === StaticEntityProperties.PriceInnerRecordHandling) {
                    entityFetchRequires.push(`priceContent(NONE)`)
                }
            })
    }

    private buildAttributesFetchRequires(requiredProperties: EntityPropertyKey[],
                                         entitySchema: EntitySchema,
                                         dataPointer: DataGridDataPointer,
                                         entityFetchRequires: string[]) {
        const requiredAttributes: string[] = requiredProperties
            .filter(({ type }) => type === EntityPropertyType.Attributes)
            .map(({ name }) => name)
            .map(it => {
                const attributeSchema: AttributeSchemaUnion | undefined = Object.values(entitySchema.attributes)
                    .find(attributeSchema => attributeSchema.nameVariants.camelCase === it)
                if (attributeSchema == undefined) {
                    throw new UnexpectedError(dataPointer.connection, `Could not find attribute '${it}' in '${dataPointer.entityType}'.`)
                }
                return attributeSchema.name
            })
        if (requiredAttributes.length > 0) {
            entityFetchRequires.push(`attributeContent(${requiredAttributes.map(it => `"${it}"`).join(',')})`)
        }
    }

    private buildAssociatedDataFetchRequires(requiredProperties: EntityPropertyKey[],
                                             entitySchema: EntitySchema,
                                             dataPointer: DataGridDataPointer,
                                             entityFetchRequires: string[]) {
        const requiredAssociatedData: string[] = requiredProperties
            .filter(({ type }) => type === EntityPropertyType.AssociatedData)
            .map(({ name }) => name)
            .map(it => {
                const associatedDataSchema: AssociatedDataSchema | undefined = Object.values(entitySchema.associatedData)
                    .find(associatedDataSchema => associatedDataSchema.nameVariants.camelCase === it)
                if (associatedDataSchema == undefined) {
                    throw new UnexpectedError(dataPointer.connection, `Could not find associated data '${it}' in '${dataPointer.entityType}'.`)
                }
                return associatedDataSchema.name
            })
        if (requiredAssociatedData.length > 0) {
            entityFetchRequires.push(`associatedDataContent(${requiredAssociatedData.map(it => `"${it}"`).join(',')})`)
        }
    }

    private async buildReferencesFetchRequires(requiredProperties: EntityPropertyKey[],
                                               entitySchema: EntitySchema,
                                               dataPointer: DataGridDataPointer,
                                               dataLocale: string | undefined, entityFetchRequires: string[]) {
        const requiredReferences: string[] = []
        for (const requiredProperty of requiredProperties) {
            if (requiredProperty.type === EntityPropertyType.References) {
                const referenceName = requiredProperty.name
                if (!requiredReferences.includes(referenceName)) {
                    requiredReferences.push(referenceName)
                }
            } else if (requiredProperty.type === EntityPropertyType.ReferenceAttributes) {
                const referenceName = requiredProperty.names[0]
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

            const requiredAttributes: string[] = requiredProperties
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
                    return attributeSchema.name
                })

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

    buildPrimaryKeyOrderBy(orderDirection: string): string {
        return `entityPrimaryKeyNatural(${orderDirection.toUpperCase()})`
    }

    buildAttributeOrderBy(attributeSchema: AttributeSchemaUnion, orderDirection: string): string {
        return `attributeNatural("${attributeSchema.name}", ${orderDirection.toUpperCase()})`
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

}
