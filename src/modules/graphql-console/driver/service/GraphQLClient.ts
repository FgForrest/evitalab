import { HttpApiClient } from '@/modules/driver-support/service/HttpApiClient'
import { Connection } from '@/modules/connection/model/Connection'
import { GraphQLResponse } from '@/modules/graphql-console/driver/model/GraphQLResponse'
import { EvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'

export const graphQLClientInjectionKey: InjectionKey<GraphQLClient> = Symbol('graphQLClient')

/**
 * Simplified GraphQL API client that doesn't need to know about specific GraphQL schemas.
 */
// todo lho merge into evitadb driver
export class GraphQLClient extends HttpApiClient {

    constructor(evitaLabConfig: EvitaLabConfig) {
        super(evitaLabConfig)
    }

    /**
     * Fetches data from evitaDB GraphQL API.
     */
    async fetch(connection: Connection, path: string, query: string, variables: any = {}): Promise<GraphQLResponse> {
        try {
            return (
                await this.httpClient.post(
                    `${connection.graphQlUrl}/${path}`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'X-EvitaDB-ClientID': this.getClientIdHeaderValue()
                        },
                        body: JSON.stringify({
                            query,
                            variables
                        })
                    }
                )
                    .json()
            ) as GraphQLResponse
        } catch (e: any) {
            throw this.handleCallError(e, connection)
        }
    }
}

export const useGraphQLClient = (): GraphQLClient => {
    return mandatoryInject(graphQLClientInjectionKey) as GraphQLClient
}
