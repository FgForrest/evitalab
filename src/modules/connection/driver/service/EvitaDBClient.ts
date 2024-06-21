import { Catalog, CatalogSchema, ModelError, QueryEntitiesRequestBody, Response } from '@/model/evitadb'
import { ApiClient } from '@/services/api-client'
import { QueryError } from '@/modules/connection/driver/service/QueryError'
import { EvitaDBConnection } from '@/model/EvitaDBConnection'

/**
 * API client for evitaDB lab API. Should not be used directly in components, instead it should be used as a low level
 * abstraction of raw HTTP API.
 */
export class EvitaDBClient extends ApiClient {

    /**
     * Fetches schema from evitaDB server for specific catalog.
     */
    async getCatalogSchema(connection: EvitaDBConnection, catalogName: string): Promise<CatalogSchema> {
        try {
            return await this.httpClient.get(
                `${connection.labApiUrl}/schema/catalogs/${catalogName}`,
                {
                    headers: {
                        'X-EvitaDB-ClientID': this.getClientIdHeaderValue()
                    }
                }
            )
                .json() as CatalogSchema
        } catch (e: any) {
            throw this.handleCallError(e, connection)
        }
    }

    /**
     * Fetches a list of all catalogs from evitaDB server.
     */
    async getCatalogs(connection: EvitaDBConnection): Promise<Catalog[]> {
        try {
            return await this.httpClient.get(
                `${connection.labApiUrl}/data/catalogs`,
                {
                    headers: {
                        'X-EvitaDB-ClientID': this.getClientIdHeaderValue()
                    }
                }
            )
                .json() as Catalog[]
        } catch (e: any) {
            throw this.handleCallError(e, connection)
        }
    }

    /**
     * Fetches entities with extra results from evitaDB server from specific catalog.
     */
    async queryEntities(connection: EvitaDBConnection, catalogName: string, query: string): Promise<Response> {
        try {
            return await this.httpClient.post(
                `${connection.labApiUrl}/data/catalogs/${catalogName}/collections/query`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-EvitaDB-ClientID': this.getClientIdHeaderValue()
                    },
                    body: JSON.stringify({
                        query
                    } as QueryEntitiesRequestBody)
                }
            )
                .json() as Response
        } catch (e: any) {
            if (e.name === 'HTTPError' && e.response.status === 400) {
                // this is a special case where this might be a user's error
                throw new QueryError(connection, (await e.response.json()) as ModelError)
            }
            throw this.handleCallError(e, connection)
        }
    }
}

