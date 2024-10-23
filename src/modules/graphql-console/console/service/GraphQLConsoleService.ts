import { buildClientSchema, getIntrospectionQuery, GraphQLSchema } from 'graphql'
import { GraphQLClient } from '@/modules/graphql-console/driver/service/GraphQLClient'
import { GraphQLConsoleDataPointer } from '@/modules/graphql-console/console/model/GraphQLConsoleDataPointer'
import { GraphQLResponse } from '@/modules/graphql-console/driver/model/GraphQLResponse'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'

export const graphQLConsoleServiceInjectionKey: InjectionKey<GraphQLConsoleService> = Symbol('graphQLConsoleService')

/**
 * Service for running GraphQL console component.
 */
export class GraphQLConsoleService {
    private readonly graphQLClient: GraphQLClient

    constructor(graphQLClient: GraphQLClient) {
        this.graphQLClient = graphQLClient
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
        let path
        if (dataPointer.instanceType === GraphQLInstanceType.System) {
            path = 'system'
        } else {
            switch (dataPointer.instanceType) {
                case GraphQLInstanceType.Data:
                    path = dataPointer.catalogName
                    break
                case GraphQLInstanceType.Schema:
                    path = `${dataPointer.catalogName}/schema`
                    break
                default: throw new UnexpectedError(`Unsupported GraphQL instance type '${dataPointer.instanceType}'.`)
            }
        }

        return await this.graphQLClient.fetch(dataPointer.connection, path, query, variables)
    }
}

export const useGraphQLConsoleService = (): GraphQLConsoleService => {
    return mandatoryInject(graphQLConsoleServiceInjectionKey) as GraphQLConsoleService
}
