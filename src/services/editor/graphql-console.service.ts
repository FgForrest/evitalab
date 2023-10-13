import { buildClientSchema, getIntrospectionQuery, GraphQLSchema } from 'graphql'
import { GraphQLInstancePointer, GraphQLInstanceType } from '@/model/editor/graphql-console'
import { inject, InjectionKey } from 'vue'
import { GraphQLResponse } from '@/model/graphql'
import { LabService } from '@/services/lab.service'
import { GraphQLClient } from '@/services/graphql-client'
import { UnexpectedError } from '@/model/lab'

export const key: InjectionKey<GraphQLConsoleService> = Symbol()

/**
 * Service for running GraphQL console component.
 */
export class GraphQLConsoleService {
    readonly labService: LabService
    readonly graphQLClient: GraphQLClient

    constructor(labService: LabService, graphQLClient: GraphQLClient) {
        this.labService = labService
        this.graphQLClient = graphQLClient
    }

    /**
     * Fetches and parses a GraphQL schema from a given evitaDB server and catalog.
     */
    getGraphQLSchema = async (instancePointer: GraphQLInstancePointer): Promise<GraphQLSchema> => {
        const introspectionSchema: GraphQLResponse = await this.callGraphQLApi(
            instancePointer,
            getIntrospectionQuery()
        )

        return buildClientSchema(introspectionSchema.data)
    }

    /**
     * Executes user GraphQL query against a given evitaDB server and catalog.
     */
    executeGraphQLQuery = async (instancePointer: GraphQLInstancePointer, query: string, variables?: object): Promise<string> => {
        const result: GraphQLResponse = await this.callGraphQLApi(
            instancePointer,
            query,
            variables
        )
        return JSON.stringify(result, null, 2)
    }

    /**
     * Executes query against evitaDB GraphQL API.
     */
    private async callGraphQLApi(instancePointer: GraphQLInstancePointer, query: string, variables: object = {}): Promise<GraphQLResponse> {
        let path
        if (instancePointer.instanceType === GraphQLInstanceType.SYSTEM) {
            path = 'system'
        } else {
            switch (instancePointer.instanceType) {
                case GraphQLInstanceType.DATA:
                    path = instancePointer.catalogName
                    break
                case GraphQLInstanceType.SCHEMA:
                    path = `${instancePointer.catalogName}/schema`
                    break
                default: throw new UnexpectedError(instancePointer.connection, `Unsupported GraphQL instance type '${instancePointer.instanceType}'.`)
            }
        }

        return await this.graphQLClient.fetch(instancePointer.connection, path, query, variables)
    }
}

export const useGraphQLConsoleService = (): GraphQLConsoleService => {
    return inject(key) as GraphQLConsoleService
}
