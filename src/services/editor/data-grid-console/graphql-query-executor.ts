import { QueryExecutor } from '@/services/editor/data-grid-console/query-executor'
import { LabService } from '@/services/lab.service'
import {
    DataGridDataPointer, EntityPropertyKey,
    EntityPropertyType, FlatEntity,
    QueryResult,
    StaticEntityProperties
} from '@/model/editor/data-grid'
import { GraphQLClient } from '@/services/graphql-client'

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

        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.PrimaryKey), this.deserializePropertyValue(entity[StaticEntityProperties.PrimaryKey])])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.Parent), this.deserializePropertyValue(entity[StaticEntityProperties.Parent])])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.Locales), this.deserializePropertyValue(entity[StaticEntityProperties.Locales])])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.AllLocales), this.deserializePropertyValue(entity[StaticEntityProperties.AllLocales])])
        flattenedEntity.push([EntityPropertyKey.entity(StaticEntityProperties.PriceInnerRecordHandling), this.deserializePropertyValue(entity[StaticEntityProperties.PriceInnerRecordHandling])])

        const attributes = entity[EntityPropertyType.Attributes] || {}
        for (const attributeName in attributes) {
            flattenedEntity.push([EntityPropertyKey.attributes(attributeName), this.deserializePropertyValue(attributes[attributeName])])
        }

        const associatedData = entity[EntityPropertyType.AssociatedData] || {}
        for (const associatedDataName in associatedData) {
            flattenedEntity.push([EntityPropertyKey.associatedData(associatedDataName), this.deserializePropertyValue(associatedData[associatedDataName])])
        }

        const references = Object.keys(entity).filter((it: string) => it.startsWith(EntityPropertyType.References + '_'))
        for (const referenceAlias in references) {
            const referenceName = referenceAlias.split('_')[1]
            const referencesOfName = entity[referenceAlias]
            if (referencesOfName instanceof Array) {
                flattenedEntity.push([EntityPropertyKey.references(referenceName), this.deserializePropertyValue(referencesOfName.map(it => it['referencedPrimaryKey']))])
            } else {
                flattenedEntity.push([EntityPropertyKey.references(referenceName), this.deserializePropertyValue(referencesOfName['referencedPrimaryKey'])])
            }
        }

        return flattenedEntity
    }
}
