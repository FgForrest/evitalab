import { type InjectionKey, type Ref, ref, shallowRef } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { asError } from '@/utils/error'
import { i18n } from '@/vue-plugins/i18n'
import type { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import type { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'
import { ApiType } from '@/modules/database-driver/request-response/status/ApiType'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { SymbolIndex, maxIndexedSymbols } from '@/modules/symbol-search/service/SymbolIndex'
import { catalogFingerprint, SymbolIndexBuilder } from '@/modules/symbol-search/service/SymbolIndexBuilder'
import type { CatalogSymbolPartition } from '@/modules/symbol-search/service/CatalogSymbolPartition'
import { CatalogSchemaListeners } from '@/modules/symbol-search/service/CatalogSchemaListeners'
import type { SymbolActionExecutor } from '@/modules/symbol-search/service/SymbolActionExecutor'
import { SymbolIndexState, SymbolIndexStatus } from '@/modules/symbol-search/model/SymbolIndexState'
import type { SymbolSearchResults } from '@/modules/symbol-search/model/SymbolSearchResults'
import type { SchemaSymbol } from '@/modules/symbol-search/model/SchemaSymbol'
import { SymbolAction } from '@/modules/symbol-search/model/SymbolAction'
import type { SymbolActionType } from '@/modules/symbol-search/model/SymbolActionType'
import { symbolActionsOf } from '@/modules/symbol-search/model/symbolActions'

/**
 * Quiet period after the last change before dirty catalogs are rebuilt. A catalog-wide invalidation notifies the
 * catalog listener and every entity listener one by one, with persistent cache deletions in between, so the
 * notifications of one change can span several macrotasks.
 */
const rebuildDebounceMs: number = 50

/**
 * A catalog left out of the index at the symbol limit, remembered so that it is not rebuilt (only to be dropped
 * again) on every change of the catalog listing.
 */
interface TruncatedCatalog {
    readonly fingerprint: string
    /** symbols of the catalog, unknown when it was left out without being read */
    readonly symbolCount: number | undefined
}

export const symbolSearchServiceInjectionKey: InjectionKey<SymbolSearchService> = Symbol('symbolSearchService')

/**
 * Facade of the application-wide symbol search: opens and closes the popup, owns the symbol index of all catalogs
 * of the connection and keeps it current.
 *
 * The index is built lazily on the first {@link open}, catalog by catalog; each catalog is searchable as soon as
 * its partition is published. Afterwards it follows the driver's change callbacks:
 *
 * - schema callbacks (catalog level and every entity type) mark their catalog dirty,
 * - the catalog statistics callback schedules a comparison of structural fingerprints (name, state, usability,
 *   mutability and entity types — never the version, which every data commit bumps): vanished catalogs are dropped,
 *   changed and new ones marked dirty.
 *
 * Dirty catalogs are rebuilt only while the index is in use: right away when the popup is open, otherwise on the
 * next open. The stale partition stays searchable until its replacement is published.
 */
export class SymbolSearchService {

    private readonly evitaClient: EvitaClient
    private readonly actionExecutor: SymbolActionExecutor
    private readonly toaster: Toaster
    private readonly builder: SymbolIndexBuilder
    private readonly index: SymbolIndex = new SymbolIndex()
    private readonly symbolLimit: number

    private readonly _opened: Ref<boolean> = ref(false)
    private readonly _state: Ref<SymbolIndexState> = shallowRef(SymbolIndexState.idle())
    private readonly _revision: Ref<number> = ref(0)
    private readonly _graphQLEnabled: Ref<boolean> = ref(false)

    private initialized: boolean = false
    private buildPromise: Promise<void> | undefined = undefined
    private lastBuildFailed: boolean = false
    private rebuildTimeoutId: ReturnType<typeof setTimeout> | undefined = undefined
    private fingerprintRefreshScheduled: boolean = false

    /** catalogs whose partition is outdated or missing and has to be (re)built */
    private readonly dirtyCatalogs: Set<string> = new Set()
    /** catalogs whose schemas could not be read in the last build, retried on the next open */
    private readonly failedCatalogs: Set<string> = new Set()
    /** bumped on every change of a catalog, a build started on an older generation is discarded */
    private readonly catalogGenerations: Map<string, number> = new Map()
    private readonly listeners: Map<string, CatalogSchemaListeners> = new Map()
    private readonly truncatedCatalogs: Map<string, TruncatedCatalog> = new Map()

    /**
     * @param evitaClient client the schemas are read through
     * @param actionExecutor opens the tabs of symbol actions
     * @param toaster reports a failed build
     * @param symbolLimit maximum number of indexed symbols
     */
    constructor(evitaClient: EvitaClient,
                actionExecutor: SymbolActionExecutor,
                toaster: Toaster,
                symbolLimit: number = maxIndexedSymbols) {
        this.evitaClient = evitaClient
        this.actionExecutor = actionExecutor
        this.toaster = toaster
        this.symbolLimit = symbolLimit
        this.builder = new SymbolIndexBuilder(evitaClient)
    }

    /**
     * Whether the popup is open.
     */
    get opened(): Readonly<Ref<boolean>> {
        return this._opened
    }

    /**
     * Current state of the index.
     */
    get state(): Readonly<Ref<SymbolIndexState>> {
        return this._state
    }

    /**
     * Bumped whenever the searchable content changes, so a displayed result list knows to search again.
     */
    get revision(): Readonly<Ref<number>> {
        return this._revision
    }

    /**
     * Whether the server exposes the GraphQL API, resolved on every open. Decides the GraphQL console actions.
     */
    get graphQLEnabled(): Readonly<Ref<boolean>> {
        return this._graphQLEnabled
    }

    open(): void {
        if (this._opened.value) {
            return
        }
        this._opened.value = true
        void this.refreshServerStatus()
        for (const catalogName of this.failedCatalogs) {
            this.dirtyCatalogs.add(catalogName)
        }
        this.failedCatalogs.clear()
        void this.ensureIndex()
    }

    close(): void {
        this._opened.value = false
    }

    toggle(): void {
        if (this._opened.value) {
            this.close()
        } else {
            this.open()
        }
    }

    /**
     * Builds the missing and outdated partitions. Concurrent calls share one build. Never rejects: a failed build is
     * reported through the toaster and the {@link state}.
     */
    ensureIndex(): Promise<void> {
        if (this.buildPromise == undefined) {
            this.buildPromise = this.runBuild().finally(() => {
                this.buildPromise = undefined
                // something changed while the build ran
                if (this.dirtyCatalogs.size > 0 && !this.lastBuildFailed) {
                    this.scheduleRebuild()
                }
            })
        }
        return this.buildPromise
    }

    /**
     * Finds symbols matching the query.
     */
    search(query: string): SymbolSearchResults {
        return this.index.search(query)
    }

    /**
     * Returns the actions of a symbol in render order, each with its availability.
     */
    getActions(symbol: SchemaSymbol): SymbolAction[] {
        return symbolActionsOf(symbol.type).map(type => new SymbolAction(
            type,
            this.actionExecutor.getDisabledReason(type, symbol, this._graphQLEnabled.value)
        ))
    }

    /**
     * Executes an action of a symbol (opens its tab) and closes the popup. A disabled action does nothing.
     */
    execute(action: SymbolActionType, symbol: SchemaSymbol): void {
        if (this.actionExecutor.getDisabledReason(action, symbol, this._graphQLEnabled.value) != undefined) {
            return
        }
        this.close()
        this.actionExecutor.execute(action, symbol, this._graphQLEnabled.value)
    }

    private async runBuild(): Promise<void> {
        this.initialize()
        try {
            const catalogs: CatalogStatistics[] = await this.builder.getCatalogs()
            await this.buildRound(catalogs)
            this.lastBuildFailed = false
        } catch (e) {
            this.lastBuildFailed = true
            this._state.value = new SymbolIndexState(
                SymbolIndexStatus.Failed,
                this.index.symbolCount,
                0,
                0,
                undefined,
                0,
                asError(e)
            )
            await this.toaster.error(i18n.global.t('symbolSearch.notification.couldNotBuildIndex'), asError(e))
        }
    }

    /**
     * Brings the partitions in line with the catalog listing: drops vanished catalogs, (re)builds dirty, changed and
     * missing ones, and cuts the index at the symbol limit in catalog name order.
     */
    private async buildRound(catalogs: CatalogStatistics[]): Promise<void> {
        const catalogNames: Set<string> = new Set(catalogs.map(catalog => catalog.name))
        for (const indexedCatalogName of this.index.catalogNames) {
            if (!catalogNames.has(indexedCatalogName)) {
                this.dropCatalog(indexedCatalogName)
            }
        }

        const catalogsToBuild: Set<string> = new Set(
            catalogs.filter(catalog => this.needsBuild(catalog)).map(catalog => catalog.name)
        )
        let builtCatalogs: number = 0
        let symbolCount: number = 0
        let truncatedCatalogs: number = 0

        for (const catalog of catalogs) {
            if (truncatedCatalogs > 0) {
                this.truncateCatalog(catalog, undefined)
                truncatedCatalogs++
                continue
            }

            const existingPartition: CatalogSymbolPartition | undefined = this.index.getPartition(catalog.name)
            let partition: CatalogSymbolPartition | undefined = existingPartition
            const knownSymbolCount: number | undefined = this.knownTruncatedSymbolCount(catalog)
            if (existingPartition == undefined &&
                knownSymbolCount != undefined &&
                symbolCount + knownSymbolCount > this.symbolLimit) {
                // unchanged and still does not fit, reading it again would only drop it again
                truncatedCatalogs++
                continue
            }
            if (catalogsToBuild.has(catalog.name)) {
                this._state.value = new SymbolIndexState(
                    SymbolIndexStatus.Building,
                    this.index.symbolCount,
                    builtCatalogs,
                    catalogsToBuild.size,
                    catalog.name
                )
                partition = (await this.buildCatalog(catalog)) ?? existingPartition
                builtCatalogs++
            }
            if (partition == undefined) {
                continue
            }

            if (symbolCount + partition.symbolCount > this.symbolLimit) {
                this.truncateCatalog(catalog, partition.symbolCount)
                truncatedCatalogs++
                continue
            }
            this.truncatedCatalogs.delete(catalog.name)
            if (partition !== existingPartition) {
                this.index.replacePartition(partition)
                this._revision.value++
                // let the popup render the newly searchable catalog before the next one is read
                await yieldToEventLoop()
            }
            symbolCount += partition.symbolCount
        }

        this._state.value = new SymbolIndexState(
            truncatedCatalogs > 0 ? SymbolIndexStatus.LimitExceeded : SymbolIndexStatus.Ready,
            this.index.symbolCount,
            builtCatalogs,
            catalogsToBuild.size,
            undefined,
            truncatedCatalogs
        )
    }

    /**
     * Builds the partition of one catalog.
     *
     * @return the partition, or undefined when the catalog changed while it was being read (it stays dirty)
     */
    private async buildCatalog(catalog: CatalogStatistics): Promise<CatalogSymbolPartition | undefined> {
        const generation: number = this.generationOf(catalog.name)
        this.dirtyCatalogs.delete(catalog.name)
        // listeners go first: a schema revalidation finishing while the schemas are being read must not be missed
        this.updateListeners(catalog)

        let partition: CatalogSymbolPartition
        try {
            partition = await this.builder.buildPartition(catalog)
        } catch (e) {
            console.warn(`Could not index symbols of catalog '${catalog.name}', only the catalog itself is searchable: `, e)
            this.failedCatalogs.add(catalog.name)
            partition = this.builder.createCatalogOnlyPartition(catalog)
        }

        if (this.generationOf(catalog.name) !== generation) {
            return undefined
        }
        return partition
    }

    private truncateCatalog(catalog: CatalogStatistics, symbolCount: number | undefined): void {
        this.dropCatalog(catalog.name)
        const fingerprint: string = catalogFingerprint(catalog)
        const previous: TruncatedCatalog | undefined = this.truncatedCatalogs.get(catalog.name)
        this.truncatedCatalogs.set(catalog.name, {
            fingerprint,
            symbolCount: symbolCount ?? (previous?.fingerprint === fingerprint ? previous.symbolCount : undefined)
        })
    }

    /**
     * Symbol count of a catalog left out at the limit whose structure has not changed since, otherwise undefined.
     */
    private knownTruncatedSymbolCount(catalog: CatalogStatistics): number | undefined {
        const truncated: TruncatedCatalog | undefined = this.truncatedCatalogs.get(catalog.name)
        if (truncated == undefined ||
            truncated.fingerprint !== catalogFingerprint(catalog) ||
            this.dirtyCatalogs.has(catalog.name)) {
            return undefined
        }
        return truncated.symbolCount
    }

    private needsBuild(catalog: CatalogStatistics): boolean {
        const partition: CatalogSymbolPartition | undefined = this.index.getPartition(catalog.name)
        return partition == undefined ||
            this.dirtyCatalogs.has(catalog.name) ||
            partition.fingerprint !== catalogFingerprint(catalog)
    }

    private initialize(): void {
        if (this.initialized) {
            return
        }
        this.initialized = true
        this.evitaClient.management.registerCatalogStatisticsChangeCallback(async () => this.onCatalogStatisticsChanged())
    }

    /**
     * The statistics cache awaits its callbacks one by one, and every data commit fires them — so this only schedules
     * the fingerprint comparison, no server I/O happens inline.
     */
    private onCatalogStatisticsChanged(): void {
        if (this.fingerprintRefreshScheduled) {
            return
        }
        this.fingerprintRefreshScheduled = true
        setTimeout(() => {
            this.fingerprintRefreshScheduled = false
            void this.refreshFingerprints()
        }, 0)
    }

    private async refreshFingerprints(): Promise<void> {
        let catalogs: CatalogStatistics[]
        try {
            catalogs = await this.builder.getCatalogs()
        } catch (e) {
            console.warn('Could not compare indexed catalogs with the catalog listing, keeping the current index: ', e)
            return
        }

        const catalogNames: Set<string> = new Set(catalogs.map(catalog => catalog.name))
        let dropped: boolean = false
        for (const indexedCatalogName of this.index.catalogNames) {
            if (!catalogNames.has(indexedCatalogName)) {
                this.dropCatalog(indexedCatalogName)
                dropped = true
            }
        }
        if (dropped && !this.state.value.building) {
            const state: SymbolIndexState = this._state.value
            this._state.value = new SymbolIndexState(
                state.status,
                this.index.symbolCount,
                state.builtCatalogs,
                state.catalogsToBuild,
                undefined,
                state.truncatedCatalogs,
                state.error
            )
        }
        for (const catalogName of Array.from(this.truncatedCatalogs.keys())) {
            if (!catalogNames.has(catalogName)) {
                this.truncatedCatalogs.delete(catalogName)
            }
        }
        for (const catalog of catalogs) {
            const partition: CatalogSymbolPartition | undefined = this.index.getPartition(catalog.name)
            const fingerprint: string = catalogFingerprint(catalog)
            if (partition == undefined) {
                // a catalog left out at the limit is looked at again only once its structure changes
                if (this.truncatedCatalogs.get(catalog.name)?.fingerprint !== fingerprint) {
                    this.markDirty(catalog.name)
                }
            } else if (partition.fingerprint !== fingerprint) {
                this.markDirty(catalog.name)
            }
        }
    }

    private markDirty(catalogName: string): void {
        this.catalogGenerations.set(catalogName, this.generationOf(catalogName) + 1)
        this.dirtyCatalogs.add(catalogName)
        this.scheduleRebuild()
    }

    /**
     * Rebuilds dirty catalogs in the background, coalescing bursts of changes (a catalog-wide invalidation notifies
     * every entity listener) into one build. Only while the popup is open.
     */
    private scheduleRebuild(): void {
        if (!this._opened.value) {
            return
        }
        if (this.rebuildTimeoutId != undefined) {
            clearTimeout(this.rebuildTimeoutId)
        }
        this.rebuildTimeoutId = setTimeout(() => {
            this.rebuildTimeoutId = undefined
            if (this._opened.value && this.dirtyCatalogs.size > 0) {
                void this.ensureIndex()
            }
        }, rebuildDebounceMs)
    }

    private dropCatalog(catalogName: string): void {
        if (this.index.getPartition(catalogName) != undefined) {
            this.index.dropPartition(catalogName)
            this._revision.value++
        }
        this.listeners.get(catalogName)?.unregister()
        this.listeners.delete(catalogName)
        this.dirtyCatalogs.delete(catalogName)
    }

    private updateListeners(catalog: CatalogStatistics): void {
        let listeners: CatalogSchemaListeners | undefined = this.listeners.get(catalog.name)
        if (listeners == undefined) {
            listeners = new CatalogSchemaListeners(this.evitaClient, catalog.name, () => this.markDirty(catalog.name))
            this.listeners.set(catalog.name, listeners)
        }
        listeners.update(catalog.entityCollectionStatistics.map(collection => collection.entityType).toArray())
    }

    private generationOf(catalogName: string): number {
        return this.catalogGenerations.get(catalogName) ?? 0
    }

    private async refreshServerStatus(): Promise<void> {
        try {
            const serverStatus: ServerStatus = await this.evitaClient.management.getServerStatus()
            this._graphQLEnabled.value = serverStatus.apiEnabled(ApiType.GraphQL)
        } catch (e) {
            // the connection explorer reports an unreachable server, here it only disables the GraphQL consoles
            console.warn('Could not resolve whether the GraphQL API is enabled: ', e)
            this._graphQLEnabled.value = false
        }
    }
}

function yieldToEventLoop(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 0))
}

export function useSymbolSearchService(): SymbolSearchService {
    return mandatoryInject(symbolSearchServiceInjectionKey)
}
