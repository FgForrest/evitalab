import { QueryBuilder } from '@/services/editor/data-grid-console/query-builder'
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
    readonly labService: LabService

    readonly entityBodyProperties: Set<string> = new Set<string>()

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

        constraints.push(`collection('${dataPointer.entityType}')`)

        const filterByContainer: string[] = []
        if (filterBy) {
            filterByContainer.push(filterBy)
        }
        if (dataLocale) {
            filterByContainer.push(`entityLocaleEquals('${dataLocale}')`)
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

        requiredProperties
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
                        entityFetchRequires.push(`hierarchyContent(stopAt(distance(1)))`)
                    } else {
                        entityFetchRequires.push(`hierarchyContent(stopAt(distance(1)), entityFetch(attributeContent(${representativeAttributes.map(attributeSchema => `'${attributeSchema.name}'`).join(',')})))`)
                    }
                } else if (it === StaticEntityProperties.PriceInnerRecordHandling) {
                    entityFetchRequires.push(`priceContent(NONE)`)
                }
            })

        const requiredAttributes: string[] = requiredProperties
            .filter(({ type }) => type === EntityPropertyType.Attributes)
            .map(({ name }) => name)
            .map(it => {
                const attributeSchema: AttributeSchemaUnion | undefined = Object.values(entitySchema.attributes)
                    .find(attributeSchema => attributeSchema.nameVariants.camelCase === it)
                if (attributeSchema == undefined) {
                    throw new UnexpectedError(undefined, `Could not find attribute '${it}' in '${dataPointer.entityType}'.`)
                }
                return `'${attributeSchema.name}'`
            })
        if (requiredAttributes.length > 0) {
            entityFetchRequires.push(`attributeContent(${requiredAttributes.join(',')})`)
        }

        const requiredAssociatedData: string[] = requiredProperties
            .filter(({ type }) => type === EntityPropertyType.AssociatedData)
            .map(({ name }) => name)
            .map(it => {
                const associatedDataSchema: AssociatedDataSchema | undefined = Object.values(entitySchema.associatedData)
                    .find(associatedDataSchema => associatedDataSchema.nameVariants.camelCase === it)
                if (associatedDataSchema == undefined) {
                    throw new UnexpectedError(undefined, `Could not find associated data '${it}' in '${dataPointer.entityType}'.`)
                }
                return `'${associatedDataSchema.name}'`
            })
        if (requiredAssociatedData.length > 0) {
            entityFetchRequires.push(`associatedDataContent(${requiredAssociatedData.join(',')})`)
        }

        const requiredReferences = requiredProperties
            .filter(({ type }) => type === EntityPropertyType.References)
            .map(({ name }) => name)
        for (const requiredReference of requiredReferences) {
            const referenceSchema: ReferenceSchema | undefined = Object.values(entitySchema.references)
                .find(referenceSchema => referenceSchema.nameVariants.camelCase === requiredReference)
            if (referenceSchema == undefined) {
                throw new UnexpectedError(undefined, `Could not find reference '${requiredReference}' in '${dataPointer.entityType}'.`)
            }

            if (referenceSchema.referencedEntityTypeManaged) {
                const referencedEntitySchema: EntitySchema = await this.labService.getEntitySchema(dataPointer.connection, dataPointer.catalogName, referenceSchema.referencedEntityType)
                const representativeAttributes: AttributeSchemaUnion[] = Object.values(referencedEntitySchema.attributes)
                    .filter(attributeSchema => 'representative' in attributeSchema && attributeSchema.representative)
                    .filter(attributeSchema => {
                        if (!dataLocale) {
                            return !attributeSchema.localized
                        }
                        return true
                    })

                if (representativeAttributes.length === 0) {
                    entityFetchRequires.push(`referenceContent('${referenceSchema.name}')`)
                } else {
                    entityFetchRequires.push(`referenceContent('${referenceSchema.name}', entityFetch(attributeContent(${representativeAttributes.map(attributeSchema => `'${attributeSchema.name}'`).join(',')})))`)
                }
            } else {
                entityFetchRequires.push(`referenceContent('${referenceSchema.name}')`)
            }
        }

        if (entityFetchRequires.length > 0 ||
            requiredProperties.findIndex(propertyKey => this.entityBodyProperties.has(propertyKey.toString())) > -1) {
            // we need to specify locale only if we want data
            if (dataLocale !== undefined) {
                entityFetchRequires.push(`dataInLocales('${dataLocale}')`)
            }

            requireConstraints.push(`entityFetch(${entityFetchRequires.join(',')})`)
        }

        if (requireConstraints.length > 0) {
            constraints.push(`require(${requireConstraints.join(',')})`)
        }

        return `query(${constraints.join(',')})`
    }

    buildAttributeOrderBy(attributeSchema: AttributeSchemaUnion, orderDirection: string): string {
        return `attributeNatural('${attributeSchema.name}', ${orderDirection.toUpperCase()})`
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
