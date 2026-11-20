import type { InjectionKey } from 'vue'
import type { Extension } from '@codemirror/state'
import type { OasContext } from '@ruzito/oas-ls-backend'
import { List as ImmutableList } from 'immutable'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { requestOutageReport } from '@/modules/database-driver/model/serverConnectivity'
import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'
import { RestOpenApi } from '@/modules/database-driver/connector/rest/model/RestOpenApi'
import { RestRequest } from '@/modules/database-driver/connector/rest/model/RestRequest'
import { RestResponse } from '@/modules/database-driver/connector/rest/model/RestResponse'
import type { CatalogSchema } from '@/modules/database-driver/request-response/schema/CatalogSchema'
import { NamingConvention } from '@/modules/database-driver/request-response/NamingConvetion'
import { RestConsoleDataPointer } from '@/modules/rest-console/console/model/RestConsoleDataPointer'
import { RestOperationCatalog } from '@/modules/rest-console/console/model/RestOperationCatalog'
import { RestEndpoint } from '@/modules/rest-console/console/model/RestEndpoint'
import { buildRestOperationCatalog } from '@/modules/rest-console/console/service/buildRestOperationCatalog'
import {
    createOasContext,
    loadRestBodyLanguageSupport,
    type RestBodyRequestMeta
} from '@/modules/rest-console/console/service/restLanguageSupport'

export const restConsoleServiceInjectionKey: InjectionKey<RestConsoleService> = Symbol('restConsoleService')

/**
 * Specification of a REST API instance together with the endpoint catalog built from it.
 */
export interface LoadedRestOpenApi {
    readonly openApi: RestOpenApi
    readonly catalog: RestOperationCatalog
}

/**
 * Locales of a catalog: those of each entity collection (keyed by its PascalCase name, as REST paths use it) and
 * their union for the catalog-level endpoints.
 */
export interface RestCatalogLocales {
    readonly byCollection: ReadonlyMap<string, ImmutableList<string>>
    readonly all: ImmutableList<string>
}

/**
 * Service for running the REST console component. Mediates between the console and {@link EvitaClient} and keeps
 * what is derived from a specification (the endpoint catalog, the language-server context) per specification
 * version, so that several consoles of one instance share it.
 */
export class RestConsoleService {
    private readonly evitaClient: EvitaClient

    /**
     * Endpoint catalogs and language-server contexts built from a specification, keyed by the specification
     * object. A specification that is replaced in the driver cache is no longer referenced by anyone and its
     * derived data goes with it.
     */
    private readonly operationCatalogs: WeakMap<RestOpenApi, RestOperationCatalog> = new WeakMap()
    private readonly oasContexts: WeakMap<RestOpenApi, OasContext> = new WeakMap()

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    /**
     * Registers a callback invoked when the cached specification of the given REST API instance changes.
     */
    registerOpenApiChangeCallback(dataPointer: RestConsoleDataPointer, callback: () => Promise<void>): string {
        return this.evitaClient.registerRestOpenApiChangedCallback(
            dataPointer.catalogName,
            dataPointer.instanceType,
            callback
        )
    }

    /**
     * Unregisters a previously registered specification change callback.
     */
    unregisterOpenApiChangeCallback(dataPointer: RestConsoleDataPointer, callbackId: string): void {
        this.evitaClient.unregisterRestOpenApiChangedCallback(
            dataPointer.catalogName,
            dataPointer.instanceType,
            callbackId
        )
    }

    /**
     * Returns the (cached) specification of the REST API instance and the endpoint catalog built from it.
     */
    async getOpenApi(dataPointer: RestConsoleDataPointer): Promise<LoadedRestOpenApi> {
        const openApi: RestOpenApi = await this.evitaClient.getRestOpenApi(
            dataPointer.catalogName,
            dataPointer.instanceType
        )
        let catalog: RestOperationCatalog | undefined = this.operationCatalogs.get(openApi)
        if (catalog == undefined) {
            catalog = buildRestOperationCatalog(openApi.document, dataPointer.instanceType)
            this.operationCatalogs.set(openApi, catalog)
        }
        return { openApi, catalog }
    }

    /**
     * Downloads the specification again and, only if it really changed, swaps it in and notifies open consoles of
     * that instance. Fetch-first: a reload that cannot reach the server keeps the specification in use.
     */
    async refreshOpenApi(dataPointer: RestConsoleDataPointer): Promise<void> {
        // a user-initiated refresh must be answered even during an outage that was already reported
        requestOutageReport()
        await this.evitaClient.refreshRestOpenApi(dataPointer.catalogName, dataPointer.instanceType)
    }

    /**
     * Returns the locales of the catalog as declared by its schema. The System API has no catalog, so it gets
     * none — its consoles fall back to what the specification declares.
     */
    async getCatalogLocales(dataPointer: RestConsoleDataPointer): Promise<RestCatalogLocales> {
        if (dataPointer.instanceType === RestInstanceType.System) {
            return { byCollection: new Map(), all: ImmutableList() }
        }
        const catalogSchema: CatalogSchema = await this.evitaClient.queryCatalog(
            dataPointer.catalogName,
            async session => await session.getCatalogSchema()
        )
        const byCollection: Map<string, ImmutableList<string>> = new Map()
        const all: Set<string> = new Set()
        for (const entitySchema of (await catalogSchema.entitySchemas()).values()) {
            const locales: ImmutableList<string> = entitySchema.locales
                .map(locale => locale.languageTag)
                .sort()
            const collectionName: string = entitySchema.nameVariants.get(NamingConvention.PascalCase) ?? entitySchema.name
            byCollection.set(collectionName, locales)
            locales.forEach(locale => all.add(locale))
        }
        return { byCollection, all: ImmutableList(Array.from(all).sort()) }
    }

    /**
     * Locales an endpoint can be called with: those of its entity collection, or all locales of the catalog for
     * catalog-level endpoints.
     */
    resolveEndpointLocales(endpoint: RestEndpoint, catalogLocales: RestCatalogLocales): ImmutableList<string> {
        if (endpoint.collectionName != undefined) {
            return catalogLocales.byCollection.get(endpoint.collectionName) ?? catalogLocales.all
        }
        return catalogLocales.all
    }

    /**
     * Calls a REST operation. Error statuses come back as a regular {@link RestResponse}; only transport failures
     * throw.
     */
    async executeRequest(dataPointer: RestConsoleDataPointer, request: RestRequest): Promise<RestResponse> {
        return await this.evitaClient.callRest(dataPointer.catalogName, dataPointer.instanceType, request)
    }

    /**
     * Creates the language support of the JSON body editor for a specification.
     *
     * @param metaProvider tells the language server which operation the body currently belongs to
     */
    async createBodyLanguageSupport(
        openApi: RestOpenApi,
        metaProvider: () => RestBodyRequestMeta
    ): Promise<Extension> {
        let context: OasContext | undefined = this.oasContexts.get(openApi)
        if (context == undefined) {
            context = createOasContext(openApi)
            this.oasContexts.set(openApi, context)
        }
        return await loadRestBodyLanguageSupport(context, metaProvider)
    }
}

export const useRestConsoleService = (): RestConsoleService => {
    return mandatoryInject(restConsoleServiceInjectionKey) as RestConsoleService
}
