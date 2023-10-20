import { QueryBuilder } from '@/services/editor/data-grid-console/query-builder'
import {
    DataGridDataPointer,
    EntityPropertyKey,
    EntityPropertyType, StaticEntityProperties
} from '@/model/editor/data-grid'
import { LabService } from '@/services/lab.service'
import { AssociatedDataSchema, AttributeSchemaUnion, EntitySchema, ReferenceSchema } from '@/model/evitadb'
import { UnexpectedError } from '@/model/lab'

/**
 * Query builder for GraphQL language.
 */
export class GraphQLQueryBuilder implements QueryBuilder {
    readonly labService: LabService

    constructor(labService: LabService) {
        this.labService = labService
    }

    async buildQuery(dataPointer: DataGridDataPointer,
                     filterBy: string,
                     orderBy: string,
                     dataLocale: string | undefined,
                     requiredData: EntityPropertyKey[],
                     pageNumber: number,
                     pageSize: number): Promise<string> {
        const entitySchema: EntitySchema = await this.labService.getEntitySchema(dataPointer.connection, dataPointer.catalogName, dataPointer.entityType)

        const headerArguments: string[] = []

        const filterByContainer: string[] = []
        if (filterBy) {
            filterByContainer.push(filterBy)
        }
        if (dataLocale) {
            filterByContainer.push(`entityLocaleEquals: ${dataLocale}`)
        }
        if (filterByContainer.length > 0) {
            headerArguments.push(`filterBy: { ${filterByContainer.join(',')} }`)
        }

        if (orderBy) {
            headerArguments.push(`orderBy: { ${orderBy} }`)
        }

        const groupedPropertyKeys: Map<EntityPropertyType, string[]> = new Map<EntityPropertyType, string[]>()
        for (const propertyKey of requiredData) {

            let group: string[] | undefined = groupedPropertyKeys.get(propertyKey.type)
            if (group == undefined) {
                group = []
                groupedPropertyKeys.set(propertyKey.type, group)
            }
            group.push(propertyKey.name)
        }

        const entityOutputFields: string[] = []
        for (const [propertyType, properties] of groupedPropertyKeys) {
            switch (propertyType) {
                case EntityPropertyType.Entity:
                    for (const property of properties) {
                        if (property === StaticEntityProperties.ParentPrimaryKey) {
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
                                entityOutputFields.push(`       ${representativeAttributes.map(attributeSchema => `${attributeSchema.nameVariants.camelCase}`).join(',') }`)
                                entityOutputFields.push('   }')
                                entityOutputFields.push('}')
                            }
                        } else {
                            entityOutputFields.push(property)
                        }
                    }
                    break
                case EntityPropertyType.Attributes:
                    if (dataLocale !== undefined) {
                        entityOutputFields.push(`attributes(locale: ${dataLocale.replace('-', '_')}) {`)
                    } else {
                        entityOutputFields.push(`attributes {`)
                    }

                    for (const property of properties) {
                        const attributeSchema: AttributeSchemaUnion | undefined = Object.values(entitySchema.attributes)
                            .find(attribute => attribute.nameVariants.camelCase === property)
                        if (attributeSchema == undefined) {
                            throw new UnexpectedError(undefined, `Attribute ${property} not found in entity ${entitySchema.name}`)
                        }
                        if (!attributeSchema.localized || dataLocale !== undefined) {
                            entityOutputFields.push(property)
                        }
                    }

                    entityOutputFields.push('}')
                    break
                case EntityPropertyType.AssociatedData:
                    if (dataLocale !== undefined) {
                        entityOutputFields.push(`associatedData(locale: ${dataLocale.replace('-', '_')}) {`)
                    } else {
                        entityOutputFields.push(`associatedData {`)
                    }

                    for (const property of properties) {
                        const associatedDataSchema: AssociatedDataSchema | undefined = Object.values(entitySchema.associatedData)
                            .find(associatedData => associatedData.nameVariants.camelCase === property)
                        if (associatedDataSchema == undefined) {
                            throw new UnexpectedError(undefined, `Associated data ${property} not found in entity ${entitySchema.name}`)
                        }
                        if (!associatedDataSchema.localized || dataLocale !== undefined) {
                            entityOutputFields.push(property)
                        }
                    }

                    entityOutputFields.push('}')
                    break
                case EntityPropertyType.References:
                    for (const referenceProperty of properties) {
                        const referenceSchema: ReferenceSchema | undefined = Object.values(entitySchema.references)
                            .find(referenceSchema => referenceSchema.nameVariants.camelCase === referenceProperty)
                        if (referenceSchema == undefined) {
                            throw new UnexpectedError(undefined, `Could not find reference '${referenceProperty}' in '${dataPointer.entityType}'.`)
                        }

                        entityOutputFields.push(`reference_${referenceProperty}: ${referenceProperty} {`)
                        entityOutputFields.push('   referencedPrimaryKey')
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

                            if (representativeAttributes.length > 0) {
                                entityOutputFields.push('   referencedEntity {')
                                entityOutputFields.push('       attributes {')
                                entityOutputFields.push(`           ${representativeAttributes.map(attributeSchema => `${attributeSchema.nameVariants.camelCase}`).join(',') }`)
                                entityOutputFields.push('       }')
                                entityOutputFields.push('   }')
                            }
                        }
                        entityOutputFields.push('}')
                    }
                    break
            }
        }

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

    buildAttributeOrderBy(attributeSchema: AttributeSchemaUnion, orderDirection: string): string {
        return `attribute${attributeSchema.nameVariants.pascalCase}Natural: ${orderDirection.toUpperCase()}`
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

}
