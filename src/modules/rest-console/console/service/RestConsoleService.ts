import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { RestClient } from '@/modules/rest-console/driver/service/RestClient'
import { RestConsoleDataPointer } from '@/modules/rest-console/console/model/RestConsoleDataPointer'
import { RestResponse } from '@/modules/rest-console/driver/model/RestResponse'
import { Locale } from '@/modules/connection/model/data-type/Locale'
import { HttpMethod } from 'ky/distribution/types/options'
import { RestOperationType, uriPath, usesHttpMethod } from '@/modules/rest-console/console/model/RestOperationType'
import Immutable from 'immutable'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { CatalogSchema } from '@/modules/connection/model/schema/CatalogSchema'
import { Value } from '@/modules/connection/model/Value'
import { EntitySchema } from '@/modules/connection/model/schema/EntitySchema'
import { Connection } from '@/modules/connection/model/Connection'

export const restConsoleServiceInjectionKey: InjectionKey<RestConsoleService> = Symbol('restConsoleService')

/**
 * Service for running REST console component.
 */
export class RestConsoleService {
    private readonly restClient: RestClient
    private readonly connectionService: ConnectionService

    constructor(restClient: RestClient, connectionService: ConnectionService) {
        this.restClient = restClient
        this.connectionService = connectionService
    }

    async getCollections(dataPointer: RestConsoleDataPointer): Promise<Immutable.List<string>> {
        const catalogSchema: CatalogSchema = await this.connectionService.getCatalogSchema(dataPointer.connection, dataPointer.catalogName)
        const entitySchemas: Value<Immutable.Map<string, EntitySchema>> = await catalogSchema.entitySchemas()
        return Immutable.List(entitySchemas.getOrThrow().keys())
    }

    /**
     * Fetches and parses a OpenAPI schema from a given evitaDB server and catalog.
     */
    async getOpenAPISchema(dataPointer: RestConsoleDataPointer): Promise<object> {
        // todo lho support for system api
        return await this.callRestApi(
            dataPointer,
            'get',
            [dataPointer.catalogName],
            undefined,
            undefined
        )
    }

    /**
     * Executes user REST query against a given evitaDB server and catalog.
     */
    async executeRestQuery(dataPointer: RestConsoleDataPointer,
                           locale: Locale | undefined,
                           entityType: string,
                           operation: RestOperationType,
                           params: Map<string, any>,
                           query: string): Promise<object> {
        // todo lho support system api
        const path: string[] = []
        path.push(dataPointer.catalogName)
        if (locale != undefined) {
            path.push(locale.toString())
        }
        path.push(entityType)
        path.push(uriPath(operation))

        return await this.callRestApi(
            dataPointer,
            usesHttpMethod(operation),
            path,
            params,
            query
        )
    }

    /**
     * Executes query against evitaDB REST API.
     */
    private async callRestApi(dataPointer: RestConsoleDataPointer,
                              httpMethod: HttpMethod,
                              path: string[],
                              params: Map<string, any> | undefined,
                              query: string): Promise<RestResponse> {
        return await this.restClient.fetch(dataPointer.connection, httpMethod, path, params, query)
    }
}

export const useRestConsoleService = (): RestConsoleService => {
    return mandatoryInject(restConsoleServiceInjectionKey) as RestConsoleService
}
