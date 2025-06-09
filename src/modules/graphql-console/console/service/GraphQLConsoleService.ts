import { buildClientSchema, getIntrospectionQuery, GraphQLSchema } from 'graphql'
import { GraphQLConsoleDataPointer } from '@/modules/graphql-console/console/model/GraphQLConsoleDataPointer'
import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { GraphQLResponse } from '@/modules/database-driver/connector/gql/model/GraphQLResponse'

export const graphQLConsoleServiceInjectionKey: InjectionKey<GraphQLConsoleService> = Symbol('graphQLConsoleService')

/**
 * Service for running GraphQL console component.
 */
export class GraphQLConsoleService {
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    registerGraphQLSchemaChangeCallback(catalogName: string, callback: () => Promise<void>): string {
        return this.evitaClient.registerCatalogSchemaChangedCallback(catalogName, callback)
    }

    unregisterGraphQLSchemaChangeCallback(catalogName: string, callbackId: string): void {
        this.evitaClient.unregisterCatalogSchemaChangedCallback(catalogName, callbackId)
    }

    /**
     * Fetches and parses a GraphQL schema from a given evitaDB server and catalog.
     */
    async getGraphQLSchema(dataPointer: GraphQLConsoleDataPointer): Promise<GraphQLSchema> {
        const introspectionSchema: GraphQLResponse = await this.callGraphQLApi(
            dataPointer,
            getIntrospectionQuery()
        )

        return buildClientSchema(introspectionSchema.data)
    }

    /**
     * Executes user GraphQL query against a given evitaDB server and catalog.
     */
    async executeGraphQLQuery(dataPointer: GraphQLConsoleDataPointer, query: string, variables?: object): Promise<string> {
        const result: GraphQLResponse = await this.callGraphQLApi(
            dataPointer,
            query,
            variables
        )
        return JSON.stringify(result, null, 2)
    }

    /**
     * Executes query against evitaDB GraphQL API.
     */
    private async callGraphQLApi(dataPointer: GraphQLConsoleDataPointer,
                                 query: string,
                                 variables: object = {}): Promise<GraphQLResponse> {
        return await this.evitaClient.queryCatalogUsingGraphQL(
            dataPointer.catalogName,
            dataPointer.instanceType,
            query,
            variables
        )
    }
}

export const useGraphQLConsoleService = (): GraphQLConsoleService => {
    return mandatoryInject(graphQLConsoleServiceInjectionKey) as GraphQLConsoleService
}
