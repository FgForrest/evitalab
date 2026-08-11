import { GraphQLSchema } from 'graphql'
import { GraphQLConsoleDataPointer } from '@/modules/graphql-console/console/model/GraphQLConsoleDataPointer'
import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { GraphQLResponse } from '@/modules/database-driver/connector/gql/model/GraphQLResponse'
import { requestOutageReport } from '@/modules/database-driver/model/serverConnectivity'

export const graphQLConsoleServiceInjectionKey: InjectionKey<GraphQLConsoleService> = Symbol('graphQLConsoleService')

/**
 * Service for running GraphQL console component.
 */
export class GraphQLConsoleService {
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    /**
     * Registers a callback invoked when the cached GraphQL schema of the given GraphQL API instance changes.
     */
    registerGraphQLSchemaChangeCallback(dataPointer: GraphQLConsoleDataPointer, callback: () => Promise<void>): string {
        return this.evitaClient.registerGraphQLSchemaChangedCallback(
            dataPointer.catalogName,
            dataPointer.instanceType,
            callback
        )
    }

    /**
     * Unregisters a previously registered GraphQL schema change callback.
     */
    unregisterGraphQLSchemaChangeCallback(dataPointer: GraphQLConsoleDataPointer, callbackId: string): void {
        this.evitaClient.unregisterGraphQLSchemaChangedCallback(
            dataPointer.catalogName,
            dataPointer.instanceType,
            callbackId
        )
    }

    /**
     * Fetches a (cached) GraphQL schema for a given evitaDB server and catalog. Pass a `signal` to bound
     * and cancel the underlying introspection request.
     */
    async getGraphQLSchema(dataPointer: GraphQLConsoleDataPointer, signal?: AbortSignal): Promise<GraphQLSchema> {
        return this.evitaClient.getGraphQLSchema(dataPointer.catalogName, dataPointer.instanceType, signal)
    }

    /**
     * Re-runs the introspection of the given GraphQL API instance and, only if the schema really changed,
     * swaps it in and notifies open consoles of that instance. Does not touch any other cache.
     *
     * Fetch-first: a reload that cannot reach the server keeps the schema the console is browsing and
     * propagates the error instead of leaving the console without a schema.
     */
    async refreshGraphQLSchema(dataPointer: GraphQLConsoleDataPointer): Promise<void> {
        // a user-initiated refresh must be answered even during an outage that was already reported
        requestOutageReport()
        await this.evitaClient.refreshGraphQLSchema(dataPointer.catalogName, dataPointer.instanceType)
    }

    /**
     * Executes user GraphQL query against a given evitaDB server and catalog.
     */
    async executeGraphQLQuery(dataPointer: GraphQLConsoleDataPointer, query: string, variables?: Record<string, unknown>): Promise<string> {
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
                                 variables: Record<string, unknown> = {}): Promise<GraphQLResponse> {
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
