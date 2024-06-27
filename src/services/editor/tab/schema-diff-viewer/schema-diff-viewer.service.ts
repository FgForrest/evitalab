import { inject, InjectionKey } from 'vue'
import { EvitaDBClient } from '@/services/evitadb-client'
import { SchemaDiffDataPointer } from '@/model/editor/tab/schema-diff-viewer/schema-diff-data-pointer'
import { GraphQLClient } from '@/services/graphql-client'
import { GraphQLSchemaDiff } from '@/model/evitadb'

export const key: InjectionKey<SchemaDiffViewerService> = Symbol()

// todo
export class SchemaDiffViewerService {
    private readonly evitaDBClient: EvitaDBClient
    private readonly graphQLClient: GraphQLClient

    constructor(evitaDBClient: EvitaDBClient, graphQLClient: GraphQLClient) {
        this.evitaDBClient = evitaDBClient
        this.graphQLClient = graphQLClient
    }

    /**
     * diff
     * @param currentCatalogPointer
     * @param comparableCatalogPointer
     */
    async getGraphQLDataApiDiff(currentCatalogPointer: SchemaDiffDataPointer, comparableCatalogPointer: SchemaDiffDataPointer): Promise<GraphQLSchemaDiff> {
        const currentCatalogSchemaDefinition: string = await this.graphQLClient.fetchSchemaDefinition(
            currentCatalogPointer.connection,
            `${currentCatalogPointer.catalogName}`
        )
        const comparableCatalogSchemaDefinition: string = await this.graphQLClient.fetchSchemaDefinition(
            comparableCatalogPointer.connection,
            `${comparableCatalogPointer.catalogName}`
        )

        return this.evitaDBClient.getGraphQLSchemaDiff(currentCatalogSchemaDefinition, comparableCatalogSchemaDefinition)
    }
}

export const useSchemaDiffViewerService = (): SchemaDiffViewerService => {
    return inject(key) as SchemaDiffViewerService
}
