import { QueryExecutor } from '@/services/editor/data-grid-console/query-executor'
import { LabService } from '@/services/lab.service'
import {
    DataGridDataPointer, EntityPropertyKey,
    EntityPropertyType, FlatEntity,
    QueryResult,
    StaticEntityProperties
} from '@/model/editor/data-grid'
import { GraphQLClient } from '@/services/graphql-client'
import { QueryError } from '@/services/evitadb-client'

/**
 * Query executor for GraphQL language.
 */
export class GraphQLQueryExecutor extends QueryExecutor {
    readonly graphQLClient: GraphQLClient

    constructor(labService: LabService, graphQLClient: GraphQLClient) {
        super(labService)
        this.graphQLClient = graphQLClient
    }

    async executeQuery(dataPointer: DataGridDataPointer, query: string): Promise<QueryResult> {
        const urlCatalogName: string = (await this.labService.getCatalogSchema(dataPointer.connection, dataPointer.catalogName))
            .nameVariants
            .kebabCase

        const result = await this.graphQLClient.fetch(
            dataPointer.connection,
            `${urlCatalogName}`,
            query
        )
        if (result.errors) {
            throw new QueryError(dataPointer.connection, result.errors)
        }

        return {
            entities: result?.data?.q?.recordPage?.data.map((entity: any) => this.flattenEntity(entity)) || [],
            totalEntitiesCount: result?.data?.q?.recordPage?.totalRecordCount || 0
        }
    }

    /**
     * Converts original rich entity into simplified flat entity that is displayable in table
     */
    private flattenEntity(entity: any): FlatEntity {
        const flattenedEntity: FlatEntity = []

        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey), entity[StaticEntityProperties.PrimaryKey]])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.ParentPrimaryKey), entity[StaticEntityProperties.ParentPrimaryKey]])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.Locales), entity[StaticEntityProperties.Locales]])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.AllLocales), entity[StaticEntityProperties.AllLocales]])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.PriceInnerRecordHandling), entity[StaticEntityProperties.PriceInnerRecordHandling]])

        const attributes = entity[EntityPropertyType.Attributes] || {}
        for (const attributeName in attributes) {
            flattenedEntity.push([EntityPropertyKey.attributes(attributeName), attributes[attributeName]])
        }

        const associatedData = entity[EntityPropertyType.AssociatedData] || {}
        for (const associatedDataName in associatedData) {
            flattenedEntity.push([EntityPropertyKey.associatedData(associatedDataName), associatedData[associatedDataName]])
        }

        const references = Object.keys(entity).filter((it: string) => it.startsWith('reference_'))
        for (const referenceAlias of references) {
            const referenceName = referenceAlias.split('_')[1]
            const referencesOfName = entity[referenceAlias]
            if (referencesOfName instanceof Array) {
                flattenedEntity.push([EntityPropertyKey.references(referenceName), referencesOfName.map(it => it['referencedPrimaryKey'])])
            } else {
                flattenedEntity.push([EntityPropertyKey.references(referenceName), referencesOfName['referencedPrimaryKey']])
            }
        }

        return flattenedEntity
    }
}
