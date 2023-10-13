import { Catalog, CatalogSchema, ModelError, QueryEntitiesRequestBody, Response } from '@/model/evitadb'
import { LabInvalidUsageError, EvitaDBConnection } from '@/model/lab'
import { ApiClient } from '@/services/api-client'

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
            return await this.httpClient.get(`${connection.labApiUrl}/schema/catalogs/${catalogName}`)
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
            return await this.httpClient.get(`${connection.labApiUrl}/data/catalogs`)
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
                        'Content-Type': 'application/json'
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

/**
 * Error that is thrown when a query to evitaDB fails.
 */
export class QueryError extends LabInvalidUsageError {
    readonly error: any

    constructor(connection: EvitaDBConnection, error: any) {
        super('QueryError', connection, 'Query error occurred.', error instanceof Array ? error.map(it => it.message).join("; ") : error.message)
        this.error = error
    }
}
