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

        this.entityBodyProperties.add(StaticEntityProperties.Parent)
        this.entityBodyProperties.add(StaticEntityProperties.Locales)
        this.entityBodyProperties.add(StaticEntityProperties.AllLocales)
        this.entityBodyProperties.add(StaticEntityProperties.PriceInnerRecordHandling)
    }

    async buildQuery(dataPointer: DataGridDataPointer,
                     filterBy: string,
                     orderBy: string,
                     dataLocale: string | undefined,
                     requiredData: EntityPropertyKey[],
                     pageNumber: number,
                     pageSize: number): Promise<string> {
        const entitySchema: EntitySchema = await this.labService.getEntitySchema(dataPointer.connection, dataPointer.catalogName, dataPointer.entityType)

        const constraints: string[] = []

        constraints.push(`collection('${dataPointer.entityType}')`)

        if (filterBy) {
            constraints.push(`filterBy(${filterBy})`)
        }

        if (orderBy) {
            constraints.push(`orderBy(${orderBy})`)
        }

        const requireConstraints: string[] = []
        requireConstraints.push(`page(${pageNumber}, ${pageSize})`)

        const entityFetchRequires: string[] = []

        const requiredAttributes: string[] = requiredData
            .filter(({ type }) => type === EntityPropertyType.Attributes)
            .map(({ name }) => name)
            .map(it => {
                const attributeSchema: AttributeSchemaUnion | undefined = Object.values(entitySchema.attributes)
                    .find(attributeSchema => attributeSchema.nameVariants.camelCase === it)
                if (attributeSchema === undefined) {
                    throw new UnexpectedError(undefined, `Could not find attribute '${it}' in '${dataPointer.entityType}'.`)
                }
                return `'${attributeSchema.name}'`
            })
        if (requiredAttributes.length > 0) {
            entityFetchRequires.push(`attributeContent(${requiredAttributes.join(',')})`)
        }

        const requiredAssociatedData: string[] = requiredData
            .filter(({ type }) => type === EntityPropertyType.AssociatedData)
            .map(({ name }) => name)
            .map(it => {
                const associatedDataSchema: AssociatedDataSchema | undefined = Object.values(entitySchema.associatedData)
                    .find(associatedDataSchema => associatedDataSchema.nameVariants.camelCase === it)
                if (associatedDataSchema === undefined) {
                    throw new UnexpectedError(undefined, `Could not find associated data '${it}' in '${dataPointer.entityType}'.`)
                }
                return `'${associatedDataSchema.name}'`
            })
        if (requiredAssociatedData.length > 0) {
            entityFetchRequires.push(`associatedDataContent(${requiredAssociatedData.join(',')})`)
        }

        const requiredReferences: string[] = requiredData
            .filter(({ type }) => type === EntityPropertyType.References)
            .map(({ name }) => name)
            .map(it => {
                const referenceSchema: ReferenceSchema | undefined = Object.values(entitySchema.references)
                    .find(referenceSchema => referenceSchema.nameVariants.camelCase === it)
                if (referenceSchema === undefined) {
                    throw new UnexpectedError(undefined, `Could not find reference '${it}' in '${dataPointer.entityType}'.`)
                }
                return `'${referenceSchema.name}'`
            })
        if (requiredReferences.length > 0) {
            entityFetchRequires.push(`referenceContent(${requiredReferences.join(',')})`)
        }

        if (entityFetchRequires.length > 0 ||
            requiredData.findIndex(propertyKey => this.entityBodyProperties.has(propertyKey.toString())) > -1) {
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

    buildAttributeNaturalConstraint(attributeSchema: AttributeSchemaUnion, orderDirection: string): string {
        return `attributeNatural('${attributeSchema.name}', ${orderDirection.toUpperCase()})`
    }

}
