import 'fake-indexeddb/auto'
import { create } from '@bufbuild/protobuf'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { LabServerDataCache } from '@/modules/storage/LabServerDataCache'
import {
    GrpcAttributeSchemaType,
    GrpcCatalogState,
    GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType,
    GrpcEvitaDataType,
    GrpcNamingConvention
} from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import {
    type GrpcCatalogSchema,
    GrpcCatalogSchemaSchema,
    type GrpcGlobalAttributeSchema,
    GrpcGlobalAttributeSchemaSchema
} from '@/modules/database-driver/connector/grpc/gen/GrpcCatalogSchema_pb'
import {
    type GrpcAssociatedDataSchema,
    GrpcAssociatedDataSchemaSchema,
    type GrpcAttributeSchema,
    GrpcAttributeSchemaSchema,
    type GrpcEntitySchema,
    GrpcEntitySchemaSchema,
    type GrpcReferenceSchema,
    GrpcReferenceSchemaSchema,
    type GrpcSortableAttributeCompoundSchema,
    GrpcSortableAttributeCompoundSchemaSchema
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchema_pb'
import {
    type GrpcCatalogStatistics,
    GrpcCatalogStatisticsSchema,
    GrpcEntityCollectionStatisticsSchema,
    type GrpcNameVariant,
    GrpcNameVariantSchema
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import { splitSymbolNameIntoWords } from '@/modules/symbol-search/service/SymbolMatcher'

/**
 * A scripted evitaDB server for symbol search tests: any number of catalogs with entity collections, attributes,
 * compounds, associated data and references, served through a real {@link EvitaClient} (real converters, real
 * caches, IndexedDB faked at the storage layer only). Extends the `TestClient` / `ServerScript` harness pattern of
 * `test/modules/database-driver/persistentCache.test.ts`, which scripts a single catalog and entity.
 *
 * Tests re-script the server by mutating {@link ScriptedEvitaServer.catalogs} and bumping versions.
 */

export interface ScriptedReference {
    name: string
    attributes?: string[]
    compounds?: string[]
}

export interface ScriptedEntity {
    name: string
    version?: number
    attributes?: string[]
    compounds?: string[]
    associatedData?: string[]
    references?: ScriptedReference[]
}

export interface ScriptedCatalog {
    name: string
    state?: GrpcCatalogState
    unusable?: boolean
    /** header version, bumped by every data commit */
    catalogVersion?: number
    schemaVersion?: number
    attributes?: string[]
    entities?: ScriptedEntity[]
}

export class ScriptedEvitaServer {
    catalogs: ScriptedCatalog[]
    /** when true, every call fails as if the server were unreachable */
    unreachable: boolean = false
    /** number of calls per RPC */
    readonly calls: Record<string, number> = {}
    /** awaited before a schema is served, lets a test change the server while a build is reading it */
    beforeSchemaServed: ((catalogName: string, entityType?: string) => Promise<void>) | undefined = undefined

    constructor(catalogs: ScriptedCatalog[]) {
        this.catalogs = catalogs
    }

    catalog(name: string): ScriptedCatalog {
        const catalog: ScriptedCatalog | undefined = this.catalogs.find(it => it.name === name)
        if (catalog == undefined) {
            throw new Error(`No scripted catalog '${name}'.`)
        }
        return catalog
    }

    entity(catalogName: string, entityType: string): ScriptedEntity {
        const entity: ScriptedEntity | undefined = (this.catalog(catalogName).entities ?? []).find(it => it.name === entityType)
        if (entity == undefined) {
            throw new Error(`No scripted entity '${catalogName}.${entityType}'.`)
        }
        return entity
    }

    record(rpc: string): void {
        if (this.unreachable) {
            throw new Error('Server unreachable.')
        }
        this.calls[rpc] = (this.calls[rpc] ?? 0) + 1
    }

    resetCalls(): void {
        for (const rpc of Object.keys(this.calls)) {
            delete this.calls[rpc]
        }
    }
}

/**
 * A real {@link EvitaClient} wired to a {@link ScriptedEvitaServer}. Two clients over the same `providerName`
 * share their on-disk cache, which models a browser reload.
 */
export class ScriptedClient {
    readonly client: EvitaClient
    readonly server: ScriptedEvitaServer

    constructor(server: ScriptedEvitaServer, providerName: string) {
        this.server = server
        this.client = new EvitaClient(
            {} as never,
            { getConnection: () => ({ name: 'test', grpcUrl: 'http://localhost:1' }) } as never,
            new LabServerDataCache(providerName)
        )
        Object.defineProperty(this.client, 'evitaClient', { get: () => this.evitaServiceClient })
        Object.defineProperty(this.client, 'evitaSessionClient', { get: () => this.sessionServiceClient })
        Object.defineProperty(this.client, 'evitaManagementClient', { get: () => this.managementServiceClient })
    }

    private get evitaServiceClient() {
        return {
            createReadOnlySession: async (request: { catalogName: string }) => {
                this.server.record('createSession')
                return { sessionId: request.catalogName, catalogState: GrpcCatalogState.ALIVE }
            },
            createReadWriteSession: async (request: { catalogName: string }) => {
                this.server.record('createSession')
                return { sessionId: request.catalogName, catalogState: GrpcCatalogState.ALIVE }
            }
        }
    }

    private get sessionServiceClient() {
        return {
            close: async () => {
                this.server.record('closeSession')
                return {}
            },
            getAllEntityTypes: async () => {
                this.server.record('getAllEntityTypes')
                return { entityTypes: [] }
            },
            getCatalogSchema: async (_request: unknown, metadata: { headers: Record<string, string> }) => {
                this.server.record('getCatalogSchema')
                await this.server.beforeSchemaServed?.(sessionCatalog(metadata))
                return { catalogSchema: grpcCatalogSchema(this.server.catalog(sessionCatalog(metadata))) }
            },
            getEntitySchema: async (request: { entityType: string }, metadata: { headers: Record<string, string> }) => {
                this.server.record('getEntitySchema')
                await this.server.beforeSchemaServed?.(sessionCatalog(metadata), request.entityType)
                const catalog: ScriptedCatalog = this.server.catalog(sessionCatalog(metadata))
                const entity: ScriptedEntity | undefined = (catalog.entities ?? []).find(it => it.name === request.entityType)
                return { entitySchema: entity == undefined ? undefined : grpcEntitySchema(entity) }
            }
        }
    }

    private get managementServiceClient() {
        return {
            getCatalogStatistics: async () => {
                this.server.record('getCatalogStatistics')
                return { catalogStatistics: this.server.catalogs.map(grpcCatalogStatistics) }
            }
        }
    }
}

function sessionCatalog(metadata: { headers: Record<string, string> }): string {
    const sessionId: string | undefined = metadata.headers['sessionId']
    if (sessionId == undefined) {
        throw new Error('Call without a session.')
    }
    return sessionId
}

function nameVariants(name: string): GrpcNameVariant[] {
    const words: string[] = splitSymbolNameIntoWords(name)
    const capitalized: string[] = words.map(word => word.charAt(0).toUpperCase() + word.slice(1))
    return [
        [GrpcNamingConvention.CAMEL_CASE, (words[0] ?? '') + capitalized.slice(1).join('')],
        [GrpcNamingConvention.PASCAL_CASE, capitalized.join('')],
        [GrpcNamingConvention.SNAKE_CASE, words.join('_')],
        [GrpcNamingConvention.UPPER_SNAKE_CASE, words.join('_').toUpperCase()],
        [GrpcNamingConvention.KEBAB_CASE, words.join('-')]
    ].map(([namingConvention, variant]) => create(GrpcNameVariantSchema, {
        namingConvention: namingConvention as GrpcNamingConvention,
        name: variant as string
    }))
}

function byName<T>(names: string[] | undefined, factory: (name: string) => T): { [key: string]: T } {
    const result: { [key: string]: T } = {}
    for (const name of names ?? []) {
        result[name] = factory(name)
    }
    return result
}

function grpcGlobalAttribute(name: string): GrpcGlobalAttributeSchema {
    return create(GrpcGlobalAttributeSchemaSchema, {
        name,
        nameVariant: nameVariants(name),
        type: GrpcEvitaDataType.STRING
    })
}

function grpcAttribute(schemaType: GrpcAttributeSchemaType): (name: string) => GrpcAttributeSchema {
    return (name: string) => create(GrpcAttributeSchemaSchema, {
        name,
        schemaType,
        nameVariant: nameVariants(name),
        type: GrpcEvitaDataType.STRING
    })
}

function grpcCompound(name: string): GrpcSortableAttributeCompoundSchema {
    return create(GrpcSortableAttributeCompoundSchemaSchema, { name, nameVariant: nameVariants(name) })
}

function grpcAssociatedData(name: string): GrpcAssociatedDataSchema {
    return create(GrpcAssociatedDataSchemaSchema, {
        name,
        nameVariant: nameVariants(name),
        type: GrpcEvitaAssociatedDataDataType_GrpcEvitaDataType.STRING
    })
}

function grpcReference(reference: ScriptedReference): GrpcReferenceSchema {
    return create(GrpcReferenceSchemaSchema, {
        name: reference.name,
        nameVariant: nameVariants(reference.name),
        entityType: reference.name,
        entityTypeNameVariant: nameVariants(reference.name),
        attributes: byName(reference.attributes, grpcAttribute(GrpcAttributeSchemaType.REFERENCE_SCHEMA)),
        sortableAttributeCompounds: byName(reference.compounds, grpcCompound)
    })
}

function grpcCatalogSchema(catalog: ScriptedCatalog): GrpcCatalogSchema {
    return create(GrpcCatalogSchemaSchema, {
        name: catalog.name,
        version: catalog.schemaVersion ?? 1,
        nameVariant: nameVariants(catalog.name),
        attributes: byName(catalog.attributes, grpcGlobalAttribute)
    })
}

function grpcEntitySchema(entity: ScriptedEntity): GrpcEntitySchema {
    const references: { [key: string]: GrpcReferenceSchema } = {}
    for (const reference of entity.references ?? []) {
        references[reference.name] = grpcReference(reference)
    }
    return create(GrpcEntitySchemaSchema, {
        name: entity.name,
        version: entity.version ?? 1,
        nameVariant: nameVariants(entity.name),
        attributes: byName(entity.attributes, grpcAttribute(GrpcAttributeSchemaType.ENTITY_SCHEMA)),
        sortableAttributeCompounds: byName(entity.compounds, grpcCompound),
        associatedData: byName(entity.associatedData, grpcAssociatedData),
        references
    })
}

function grpcCatalogStatistics(catalog: ScriptedCatalog): GrpcCatalogStatistics {
    return create(GrpcCatalogStatisticsSchema, {
        catalogName: catalog.name,
        catalogState: catalog.state ?? GrpcCatalogState.ALIVE,
        catalogVersion: String(catalog.catalogVersion ?? 1),
        totalRecords: '10',
        indexCount: '2',
        sizeOnDiskInBytes: '1024',
        readOnly: false,
        unusable: catalog.unusable ?? false,
        entityCollectionStatistics: (catalog.entities ?? []).map(entity => create(GrpcEntityCollectionStatisticsSchema, {
            entityType: entity.name,
            totalRecords: 1,
            indexCount: 1,
            sizeOnDiskInBytes: '1'
        }))
    })
}

/** Lets all already-scheduled microtasks (including background revalidations) run. */
export async function settle(): Promise<void> {
    for (let i = 0; i < 50; i++) {
        await Promise.resolve()
    }
}

/** Lets macrotasks run too (scheduled rebuilds, IndexedDB write-throughs). */
export async function flushTasks(): Promise<void> {
    for (let i = 0; i < 30; i++) {
        await new Promise<void>(resolve => setTimeout(resolve, 0))
    }
}
