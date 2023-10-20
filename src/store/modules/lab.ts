import { DuplicateEvitaDBConnectionError, EvitaDBBlogPost, EvitaDBConnection, EvitaDBConnectionId } from '@/model/lab'
import { Catalog, CatalogSchema, EntitySchema, EntitySchemas } from '@/model/evitadb'
import Cookies from 'js-cookie'
import { LabStorage } from '@/services/lab-storage'

/**
 * Cookie containing the name of a hosting server. This is mainly for namespacing storages.
 */
const serverNameCookieName: string = 'evitalab_servername'
/**
 * Cookie containing the read-only flag. This defines whether the lab is in read-only mode.
 */
const readonlyCookieName: string = 'evitalab_readonly'
/**
 * Cookie containing preconfigured connections. These will be displayed next to the user-defined connections.
 */
const preconfiguredConnectionsCookieName: string = 'evitalab_pconnections'

const defaultServerName: string = 'standalone'

/**
 * Stores global information about configured evitaDB servers.
 */
export type LabState = {
    readonly serverName: string,
    readonly storage: LabStorage,
    /**
     * Flag indicating whether the lab is in read-only mode.
     */
    readonly readOnly: boolean,

    /**
     * List of preconfigured evitaDB servers by hosted server.
     */
    readonly preconfiguredConnections: EvitaDBConnection[],
    /**
     * List of configured evitaDB servers by user.
     */
    readonly userConnections: EvitaDBConnection[],

    readonly catalogs: Map<EvitaDBConnectionId, Map<string, Catalog>>,

    /**
     * Cache of catalog schemas for all servers.
     */
    readonly catalogSchemas: Map<EvitaDBConnectionId, Map<string, CatalogSchema>>,

    /**
     * Cached list of the latest blog posts from evitaDB blog for welcome screen.
     */
    readonly blogPosts: EvitaDBBlogPost[],

    // todo lho logs history, mainly errors for debugging
}

type LabGetters = {
    isConnectionExists(state: LabState): (connectionName: string) => boolean
    getConnection(state: LabState): (id: EvitaDBConnectionId) => EvitaDBConnection | undefined
    getConnections(state: LabState): () => EvitaDBConnection[]

    getCatalog(state: LabState): (connectionId: EvitaDBConnectionId, catalogName: string) =>  Catalog | undefined
    getCatalogs(state: LabState): (connectionId: EvitaDBConnectionId) => Catalog[] | undefined

    getCatalogSchema(state: LabState): (connectionId: EvitaDBConnectionId, catalogName: string) => CatalogSchema | undefined
    getEntitySchema(state: LabState): (connectionId: EvitaDBConnectionId, catalogName: string, entityType: string) => EntitySchema | undefined
}

type LabMutations = {
    addConnection(state: LabState, connection: EvitaDBConnection): void
    removeConnection(state: LabState, connectionName: string): void

    putCatalogs(state: LabState, payload: { connectionId: EvitaDBConnectionId, catalogs: Catalog[] }): void
    putCatalogSchema(state: LabState, payload: { connectionId: EvitaDBConnectionId, catalogSchema: CatalogSchema }): void

    setBlogPosts(state: LabState, blogPosts: EvitaDBBlogPost[]): void
}

const state = (): LabState => {
    const serverNameCookie: string | undefined = Cookies.get(serverNameCookieName)
    const serverName: string = serverNameCookie != undefined ? atob(serverNameCookie) : defaultServerName

    const readOnlyCookie: string | undefined = Cookies.get(readonlyCookieName)
    const readOnly: boolean = readOnlyCookie != undefined && atob(readOnlyCookie) === 'true'

    let preconfiguredConnections: EvitaDBConnection[] = []
    // load preconfigured connections from cookie from hosted evitaDB instance
    const preconfiguredConnectionsCookie: string | undefined = Cookies.get(preconfiguredConnectionsCookieName)
    if (preconfiguredConnectionsCookie != undefined) {
        try {
            preconfiguredConnections = (JSON.parse(atob(preconfiguredConnectionsCookie)) as Array<any>)
                .map(connection => EvitaDBConnection.fromJson(connection, true))
        } catch (e) {
            console.error('Failed to load preconfigured connections cookie', e)
        }
    }
    // automatic demo connection configuration for easier development
    if (import.meta.env.DEV) {
        preconfiguredConnections.push(new EvitaDBConnection(
            'demo',
            'Demo',
            true,
            'https://demo.evitadb.io/lab/api',
            'https://demo.evitadb.io:5555/rest',
            'https://demo.evitadb.io:5555/gql'
        ))
        preconfiguredConnections.push(new EvitaDBConnection(
            'localhost',
            'Localhost',
            true,
            'https://localhost:5555/lab/api',
            'https://localhost:5555/rest',
            'https://localhost:5555/gql'
        ))
    }

    // initialize storage for the current instance
    const storage = new LabStorage(serverName)

    // load user-defined connections from local storage
    const userConnections: EvitaDBConnection[] = storage.getUserConnections()

    // expire cookies, so when the lab is reloaded, it will load new cookie values
    Cookies.remove(serverNameCookieName)
    Cookies.remove(readonlyCookieName)
    Cookies.remove(preconfiguredConnectionsCookieName)

    return {
        serverName,
        storage,
        readOnly,
        preconfiguredConnections,
        userConnections,
        catalogs: new Map<EvitaDBConnectionId, Map<string, Catalog>>(),
        catalogSchemas: new Map<EvitaDBConnectionId, Map<string, CatalogSchema>>(),
        blogPosts: []
    }
}

const getters: LabGetters = {
    isConnectionExists(state: LabState): (connectionName: string) => boolean {
        return (connectionName: string) => {
            // todo lho change to getter
            return [...state.preconfiguredConnections, ...state.userConnections].find((c: any) => c.name === connectionName) !== undefined
        }
    },
    getConnection(state: LabState): (id: EvitaDBConnectionId) => EvitaDBConnection | undefined {
        return (id: EvitaDBConnectionId) => {
            return [...state.preconfiguredConnections, ...state.userConnections].find((c: any) => c.id === id)
        }
    },
    getConnections(state: LabState): () => EvitaDBConnection[] {
        return () => {
            return [...state.preconfiguredConnections, ...state.userConnections]
        }
    },

    getCatalog(state: LabState): (connectionId: EvitaDBConnectionId, catalogName: string) => Catalog | undefined {
        return (connectionId: EvitaDBConnectionId, catalogName: string) => {
            return state.catalogs.get(connectionId)?.get(catalogName)
        }
    },
    getCatalogs(state: LabState): (connectionId: EvitaDBConnectionId) => Catalog[] | undefined {
        return (connectionId: EvitaDBConnectionId) => {
            const catalogs: IterableIterator<Catalog> | undefined = state.catalogs.get(connectionId)?.values()
            if (catalogs == undefined) {
                return undefined
            }
            return Array.from(catalogs)
        }
    },
    getCatalogSchema(state: LabState): (connectionId: EvitaDBConnectionId, catalogName: string) => CatalogSchema | undefined {
        return (connectionId: EvitaDBConnectionId, catalogName: string) => {
            return state.catalogSchemas.get(connectionId)?.get(catalogName)
        }
    },
    getEntitySchema(state: LabState): (connectionId: EvitaDBConnectionId, catalogName: string, entityType: string) => EntitySchema | undefined {
        return (connectionId: EvitaDBConnectionId, catalogName: string, entityType: string) => {
            const entitySchemas: EntitySchemas | undefined = state.catalogSchemas.get(connectionId)
                ?.get(catalogName)
                ?.entitySchemas
            if (entitySchemas == undefined) {
                return undefined
            }
            return Object.values(entitySchemas).find(entitySchema => entitySchema.name === entityType)
        }
    }
}

const mutations: LabMutations = {
    addConnection(state, connection): void {
        // todo lho change to getter
        if ([...state.preconfiguredConnections, ...state.userConnections].findIndex((c: any) => c.name === connection.name) !== -1) {
            throw new DuplicateEvitaDBConnectionError(connection.name)
        }
        state.userConnections.push(connection)
        state.storage.storeUserConnections(state.userConnections)
    },

    removeConnection(state, connectionName): void {
        state.userConnections.splice(state.userConnections.findIndex(connection => connection.name === connectionName), 1)
        state.storage.storeUserConnections(state.userConnections)
    },

    putCatalogs(state, payload): void {
        state.catalogs.set(
            payload.connectionId,
            new Map<string, Catalog>(payload.catalogs.map(catalog => [catalog.name, catalog]))
        )
    },

    putCatalogSchema(state, payload): void {
        state.catalogSchemas.set(
            payload.connectionId,
            new Map<string, CatalogSchema>([[payload.catalogSchema.name, payload.catalogSchema]])
        )
    },

    setBlogPosts(state, blogPosts): void {
        state.blogPosts.splice(0, state.blogPosts.length)
        state.blogPosts.push(...blogPosts)
    }
}

export default {
    namespaced: true,
    state,
    getters,
    mutations
}
