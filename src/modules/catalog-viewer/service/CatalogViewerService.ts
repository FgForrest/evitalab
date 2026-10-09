import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { EntitySchema } from '@/modules/database-driver/request-response/schema/EntitySchema'
import { List as ImmutableList } from 'immutable'
import {
    CatalogStatisticsComponent
} from '@/modules/database-driver/request-response/statistics/CatalogStatisticsComponent'
import {
    CatalogStatisticsSnapshot
} from '@/modules/database-driver/request-response/statistics/CatalogStatisticsSnapshot'
import {
    EntityCollectionStatisticsSnapshot
} from '@/modules/database-driver/request-response/statistics/EntityCollectionStatisticsSnapshot'
import { IndexBrowseCriteria } from '@/modules/database-driver/request-response/statistics/IndexBrowseCriteria'
import { BrowsedIndexPage } from '@/modules/database-driver/request-response/statistics/BrowsedIndexPage'
import { IndexDetail } from '@/modules/database-driver/request-response/statistics/IndexDetail'
import { MutationHistoryPage } from '@/modules/database-driver/request-response/cdc/MutationHistoryPage'
import {
    MutationHistoryRequest,
    reverseScanStartIndex
} from '@/modules/history-viewer/model/MutationHistoryRequest'
import { TransactionMutation } from '@/modules/database-driver/request-response/transaction/TransactionMutation'
import { CatalogVersionSummary } from '@/modules/catalog-viewer/model/CatalogVersionSummary'
import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import { TaskState } from '@/modules/database-driver/request-response/task/TaskState'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { ClassifierType } from '@/modules/database-driver/data-type/ClassifierType'
import { ClassifierValidationErrorType } from '@/modules/database-driver/data-type/ClassifierValidationErrorType'

export const catalogViewerServiceInjectionKey: InjectionKey<CatalogViewerService> = Symbol('catalogViewerService')

/**
 * How much wider than the requested version count a capture page is fetched. One committed version contributes one
 * transaction lead plus every capture of that transaction, so asking for exactly `pageSize` captures would return
 * far fewer than `pageSize` versions.
 */
const captureOverfetchFactor: number = 10

/**
 * Components each page of the catalog viewer requests. Keeping them here rather than in the page components is what
 * makes the refresh policy reviewable in one place: the cheap sets are polled, the costly ones are not.
 */
export const catalogViewerComponents = {
    /**
     * Cheap in-memory counters — polled while the Overview page is focused. The collections table is *not* part of
     * this set: the inventory holds no statistics, so every populated column costs one collection-level call.
     */
    overview: [
        CatalogStatisticsComponent.Identity,
        CatalogStatisticsComponent.RecordCounts,
        CatalogStatisticsComponent.Collections,
        CatalogStatisticsComponent.Sessions,
        CatalogStatisticsComponent.IndexSummary
    ],
    /**
     * One collection-level call per row of the Overview table.
     */
    overviewCollectionRow: [
        CatalogStatisticsComponent.Collections,
        CatalogStatisticsComponent.RecordCounts,
        CatalogStatisticsComponent.StorageSize,
        CatalogStatisticsComponent.IndexSummary
    ],
    /**
     * Targeted file stats plus one directory listing — on activation, then manual. `COLLECTIONS` is requested for
     * the "largest record ever seen" high-water mark, which `FRAGMENTATION` does not carry.
     */
    storage: [
        CatalogStatisticsComponent.Identity,
        CatalogStatisticsComponent.StorageSize,
        CatalogStatisticsComponent.StorageComposition,
        CatalogStatisticsComponent.Fragmentation,
        CatalogStatisticsComponent.VolatileState,
        CatalogStatisticsComponent.Collections
    ],
    /**
     * Per-collection storage breakdown of the Storage page — the composition alone. The table renders nothing else
     * from these rows, and every extra component here is paid once per collection on every visit.
     */
    storageCollectionRow: [
        CatalogStatisticsComponent.StorageComposition
    ],
    /**
     * Catalog level: the collection inventory plus the catalog's own global unique indexes, all `O(1)` counters.
     */
    indexes: [
        CatalogStatisticsComponent.Identity,
        CatalogStatisticsComponent.Collections,
        CatalogStatisticsComponent.IndexSummary,
        CatalogStatisticsComponent.IndexCardinality
    ],
    /**
     * Collection level: the breakdown by type and scope is cheap, the cardinality walk is not — requested only for
     * the collection the user opened.
     */
    indexesCollection: [
        CatalogStatisticsComponent.IndexSummary,
        CatalogStatisticsComponent.IndexCardinality
    ],
    /**
     * Count badge of one chip of the owner selector — the per-(type, scope) counters alone, without the cardinality
     * walk. The catalog level reports only the catalog-wide total by design, so this is one call per collection.
     */
    indexesCollectionSummary: [
        CatalogStatisticsComponent.IndexSummary
    ],
    /**
     * In-memory counters and already-sampled rates — polled while the Activity page is focused.
     */
    activity: [
        CatalogStatisticsComponent.Identity,
        CatalogStatisticsComponent.Activity,
        CatalogStatisticsComponent.CommitPipeline,
        CatalogStatisticsComponent.Durability
    ],
    /**
     * Time-travel coordinates — on activation, then manual.
     */
    history: [
        CatalogStatisticsComponent.Identity,
        CatalogStatisticsComponent.History,
        CatalogStatisticsComponent.StorageSize
    ]
} as const

/**
 * Reads catalog statistics for the catalog viewer, and requests the one write the viewer offers — restoring a
 * catalog to a listed version. Every read reaches the server — a statistics snapshot is a measurement at one
 * instant, so nothing here is cached.
 */
export class CatalogViewerService {

    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    /**
     * The catalog listing entry — the name, lifecycle state and write mode the tab header reports.
     */
    async getCatalogStatistics(catalogName: string): Promise<CatalogStatistics> {
        return await this.evitaClient.management.getCatalogStatisticsForCatalog(catalogName)
    }

    async getCatalogSnapshot(
        catalogName: string,
        components: readonly CatalogStatisticsComponent[]
    ): Promise<CatalogStatisticsSnapshot> {
        return await this.evitaClient.management.getCatalogStatisticsSnapshot(catalogName, ImmutableList(components))
    }

    async getCollectionSnapshot(
        catalogName: string,
        entityType: string,
        components: readonly CatalogStatisticsComponent[]
    ): Promise<EntityCollectionStatisticsSnapshot> {
        return await this.evitaClient.management.getEntityCollectionStatisticsSnapshot(
            catalogName,
            entityType,
            ImmutableList(components)
        )
    }

    /**
     * Reference names declared by one collection's schema, for the reference filter of the index browse.
     *
     * Read from the schema rather than from the browse rows: naming a reference the schema does not declare is an
     * error server-side, and the rows of one page cannot enumerate the references of a whole collection anyway.
     */
    async getReferenceNames(catalogName: string, entityType: string): Promise<ImmutableList<string>> {
        const schema: EntitySchema = await this.evitaClient.queryCatalog(
            catalogName,
            async session => await session.getEntitySchemaOrThrowException(entityType)
        )
        return ImmutableList(schema.references.keySeq().toArray()).sort()
    }

    /**
     * Lists committed catalog versions, newest first, from the **mutation history API**.
     *
     * The `HISTORY` statistics component carries only the retention coordinates — oldest and newest version, WAL
     * files, the deletion floor and the awaiting-deletion split. It has no per-version listing, so this is sourced
     * from the same API the `history-viewer` uses, which is what the History page links each row out to.
     *
     * The API is reverse-only and its page is a page of *captures*, not of versions, so a page here is assembled
     * by keeping the transaction lead of every version the capture pages touched. One bulk transaction can hold
     * more captures than a whole capture page, so a single fetch may deliver fewer versions than asked for — the
     * scan then continues below the oldest version it touched (whose lead the driver has already merged in) until
     * the page is assembled or the retained history ends. Each fetch advances at least one version, so the loop
     * is bounded by the history actually paged over.
     *
     * @param sinceVersion inclusive upper bound of the reverse scan; `undefined` starts at the newest version
     * @param pageSize     how many versions to aim for — each capture page is requested wider, since one version
     *                     contributes many captures
     */
    async getCatalogVersions(
        catalogName: string,
        sinceVersion: number | undefined,
        pageSize: number
    ): Promise<ImmutableList<CatalogVersionSummary>> {
        return await this.evitaClient.queryCatalog(catalogName, async session => {
            const versions: CatalogVersionSummary[] = []
            const seen: Set<number> = new Set()
            const captureLimit: number = pageSize * captureOverfetchFactor
            let anchorVersion: number | undefined = sinceVersion

            while (versions.length < pageSize) {
                const page: MutationHistoryPage = await session.getMutationHistory(
                    new MutationHistoryRequest({
                        sinceVersion: anchorVersion,
                        sinceIndex: anchorVersion != undefined ? reverseScanStartIndex : undefined,
                        loadTransaction: true
                    }),
                    captureLimit
                )
                for (const record of page.records) {
                    const body = record.body
                    if (!(body instanceof TransactionMutation) || seen.has(body.version)) {
                        continue
                    }
                    seen.add(body.version)
                    versions.push(new CatalogVersionSummary(
                        body.version,
                        body.commitTimestamp ?? record.commitTimestamp,
                        body.mutationCount,
                        body.walSizeInBytes
                    ))
                    if (versions.length === pageSize) {
                        break
                    }
                }
                // a short capture page is the end of the retained history — only the streamed captures count,
                // the merged transaction overviews do not relate to the requested size
                if (page.captureCount < captureLimit) {
                    break
                }
                const oldestTouched: number | undefined = page.records.last(undefined)?.version
                if (oldestTouched == undefined || oldestTouched <= 1) {
                    break
                }
                anchorVersion = oldestTouched - 1
            }
            return ImmutableList(versions)
        })
    }

    /**
     * Names of the catalogs the server currently lists, for the target selector of the restore dialog.
     */
    async getCatalogNames(): Promise<ImmutableList<string>> {
        const catalogs: ImmutableList<CatalogStatistics> = await this.evitaClient.management.getCatalogStatistics()
        return catalogs.map(it => it.name).sort()
    }

    /**
     * Validates a catalog name the way the server will — format, reserved keywords, whitespace. Existence is
     * deliberately not checked here: a restore may target an existing catalog as well as a free name.
     */
    async isCatalogNameValid(catalogName: string): Promise<ClassifierValidationErrorType | undefined> {
        return await this.evitaClient.management.isClassifierValid(ClassifierType.Catalog, catalogName)
    }

    /**
     * Requests the server to put a catalog back to one of the versions the History page lists. The whole operation
     * runs as one server task; the returned status is its initial state, and the catalog keeps serving until the
     * final swap. See `EvitaClientManagement.restoreCatalogToVersion` for what it destroys.
     *
     * @param targetCatalogName the catalog the restored state is served under; the source catalog itself when it
     *                          equals `catalogName`, which is sent as "unset" so the server applies its own default
     */
    async restoreCatalogToVersion(
        catalogName: string,
        version: number,
        targetCatalogName: string
    ): Promise<TaskStatus> {
        return await this.evitaClient.management.restoreCatalogToVersion(
            catalogName,
            BigInt(version),
            undefined,
            targetCatalogName === catalogName ? undefined : targetCatalogName
        )
    }

    /**
     * Follows one server task until it ends, yielding every status read — the terminal one included — so the caller
     * can render progress and then react to the outcome. One status is read per `pollingInterval`; the first read
     * waits one interval too, because the status the task was created with is already in the caller's hands.
     *
     * Ends when the task is finished or failed, or silently when `signal` is aborted (the caller went away — the
     * task itself keeps running on the server). Throws when the server no longer knows the task: a task that is
     * gone before it was seen to end has no outcome to report, and the caller has to say so.
     */
    async *followTask(taskId: Uuid, pollingInterval: number, signal?: AbortSignal): AsyncIterable<TaskStatus> {
        while (!(signal?.aborted ?? false)) {
            await this.sleep(pollingInterval, signal)
            if (signal?.aborted ?? false) {
                return
            }
            const task: TaskStatus | undefined = await this.evitaClient.management.getTaskStatus(taskId)
            if (task == undefined) {
                throw new UnexpectedError(`The server no longer knows the task ${taskId.toString()}.`)
            }
            yield task
            if (task.state === TaskState.Finished || task.state === TaskState.Failed) {
                return
            }
        }
    }

    private sleep(millis: number, signal?: AbortSignal): Promise<void> {
        return new Promise<void>(resolve => {
            const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => {
                signal?.removeEventListener('abort', onAbort)
                resolve()
            }, millis)
            const onAbort = (): void => {
                clearTimeout(timeoutId)
                resolve()
            }
            signal?.addEventListener('abort', onAbort, { once: true })
        })
    }

    async browseIndexes(criteria: IndexBrowseCriteria): Promise<BrowsedIndexPage> {
        return await this.evitaClient.management.browseIndexes(criteria)
    }

    /**
     * Measures one index. Expensive — call it only from an explicit per-row user action.
     */
    async getIndexDetail(
        catalogName: string,
        entityType: string | undefined,
        indexPrimaryKey: number
    ): Promise<IndexDetail> {
        return await this.evitaClient.management.getIndexDetail(catalogName, entityType, indexPrimaryKey)
    }
}

export const useCatalogViewerService = (): CatalogViewerService => {
    return mandatoryInject(catalogViewerServiceInjectionKey) as CatalogViewerService
}
