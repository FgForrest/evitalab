import { HttpApiClient } from '@/modules/driver-support/service/HttpApiClient'
import { Connection } from '@/modules/connection/model/Connection'
import { EvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { RestResponse } from '@/modules/rest-console/driver/model/RestResponse'
import { HttpMethod, Input, Options } from 'ky/distribution/types/options'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

export const restClientInjectionKey: InjectionKey<RestClient> = Symbol('restClient')

/**
 * Simplified REST API client that doesn't need to know about specific REST schemas.
 */
// todo lho merge into evitadb driver
export class RestClient extends HttpApiClient {

    constructor(evitaLabConfig: EvitaLabConfig) {
        super(evitaLabConfig)
    }

    /**
     * Fetches data from evitaDB REST API.
     */
    async fetch(connection: Connection,
                httpMethod: HttpMethod,
                path: string[],
                params: Map<string, any> | undefined,
                query: string): Promise<RestResponse> {
        try {
            let url: string = `${connection.restUrl}/${path.join('/')}`
            if (params != undefined && params.size > 0) {
                const paramPairs: string[] = []
                params.forEach((value, key) => paramPairs.push(`${key}=${value}`))
                url += `?${paramPairs.join('&')}`
            }

            switch (httpMethod) {
                case 'get': {
                    const request: Options = {
                        headers: {
                            'Accept': 'application/json',
                            'X-EvitaDB-ClientID': this.getClientIdHeaderValue()
                        }
                    }
                    return (await this.httpClient.get(url, request).json()) as RestResponse;
                }
                case 'post': {
                    const request: Options = {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'X-EvitaDB-ClientID': this.getClientIdHeaderValue()
                        },
                        body: query
                    }
                    return (await this.httpClient.post(url, request).json()) as RestResponse;
                }
                case 'delete': {
                    const request: Options = {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'X-EvitaDB-ClientID': this.getClientIdHeaderValue()
                        },
                        body: query
                    }
                    return (await this.httpClient.delete(url, request).json()) as RestResponse;
                }
                default:
                    throw new UnexpectedError(`Unsupported HTTP method '${httpMethod}'.`);
            }
        } catch (e: any) {
            throw this.handleCallError(e, connection)
        }
    }
}

export const useRestClient = (): RestClient => {
    return mandatoryInject(restClientInjectionKey) as RestClient
}
