import ky from 'ky'
import { Catalog, CatalogSchema, ModelError, QueryEntitiesRequestBody, Response } from '@/model/evitadb'
import { EvitaDBConnection } from '@/model/lab'
import { LabError } from '@/model/editor/editor'
import { ApiClient } from '@/services/api-client'

/**
 * API client for evitaDB lab API. Should not be used directly in components, instead it should be used as a low level
 * abstraction of raw HTTP API.
 */
export class EvitaDBClient extends ApiClient {

    /**
     * Fetches schema from evitaDB server for specific catalog.
     */
    async getCatalogSchema(connection: EvitaDBConnection, urlCatalogName: string): Promise<CatalogSchema> {
        try {
            return await ky.get(`${connection.labApiUrl}/schema/catalogs/${urlCatalogName}`)
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
            return await ky.get(`${connection.labApiUrl}/data/catalogs`)
                .json() as Catalog[]
        } catch (e: any) {
            throw this.handleCallError(e, connection)
        }
    }

    /**
     * Fetches entities with extra results from evitaDB server from specific catalog.
     */
    async queryEntities(connection: EvitaDBConnection, urlCatalogName: string, query: string): Promise<Response> {
        try {
            return await ky.post(
                `${connection.labApiUrl}/data/catalogs/${urlCatalogName}/collections/query`,
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
export class QueryError extends LabError {
    readonly error: any

    constructor(connection: EvitaDBConnection, error: any) {
        super('QueryError', connection, 'Query error occurred.')
        this.error = error
    }
}
