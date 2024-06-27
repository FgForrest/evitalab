import {
    Catalog,
    CatalogSchema,
    GraphQLSchemaDiff,
    ModelError,
    QueryEntitiesRequestBody,
    Response
} from '@/model/evitadb'
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

    /**
     * todo
     * @param oldSchema
     * @param newSchema
     */
    async getGraphQLSchemaDiff(oldSchema: string, newSchema: string): Promise<GraphQLSchemaDiff> {
        const oldSchemaBlob: Blob = new Blob([oldSchema], { type: 'text/plain' });
        const newSchemaBlob: Blob = new Blob([newSchema], { type: 'text/plain' });

        const formData: FormData = new FormData();
        formData.append("oldSchema", oldSchemaBlob, "oldSchema.graphql");
        formData.append("newSchema", newSchemaBlob, "newSchema.graphql");

        try {
            return await this.httpClient.post(
                `${this.myStore.state.lab.apiCompatibilityServer}/lab/api/tools/api-schema-diff/graphql`,
                {
                    headers: {
                        'X-EvitaDB-ClientID': this.getClientIdHeaderValue()
                    },
                    body: formData
                }
            )
                .json() as GraphQLSchemaDiff
        } catch (e: any) {
            throw this.handleCallError(e)
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
