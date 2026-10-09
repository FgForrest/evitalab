import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { List as ImmutableList } from 'immutable'
import { CatalogViewerService } from '@/modules/catalog-viewer/service/CatalogViewerService'
import type { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { CaptureArea } from '@/modules/database-driver/request-response/cdc/CaptureArea'
import { Operation } from '@/modules/database-driver/request-response/cdc/Operation'
import { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture'
import { MutationHistoryPage } from '@/modules/database-driver/request-response/cdc/MutationHistoryPage'
import {
    MutationHistoryRequest,
    reverseScanStartIndex
} from '@/modules/history-viewer/model/MutationHistoryRequest'
import { TransactionMutation } from '@/modules/database-driver/request-response/transaction/TransactionMutation'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { TaskStatus } from '@/modules/database-driver/request-response/task/TaskStatus'
import { TaskState } from '@/modules/database-driver/request-response/task/TaskState'
import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { Set as ImmutableSet } from 'immutable'

/**
 * `getCatalogVersions` assembles a page of *versions* from pages of *captures*, and the two do not relate: one bulk
 * transaction can hold more captures than a whole capture page. These tests drive the assembly with scripted capture
 * pages and verify the scan continues below the oldest touched version instead of declaring a premature end of
 * history (the regression the loop exists for).
 */

const commitTimestamp: OffsetDateTime = OffsetDateTime.of(1_700_000_000n, 0, 'Z')

/**
 * The transaction lead of a version, as the driver merges it in at the head of the version's capture group.
 */
function lead(version: number, mutationCount: number): ChangeCatalogCapture {
    return new ChangeCatalogCapture(
        version,
        0,
        CaptureArea.Infrastructure,
        undefined,
        undefined,
        Operation.Transaction,
        new TransactionMutation(`tx-${version}`, version, mutationCount, 1024, commitTimestamp),
        commitTimestamp
    )
}

function capture(version: number, index: number): ChangeCatalogCapture {
    return new ChangeCatalogCapture(
        version,
        index,
        CaptureArea.Data,
        'Product',
        index,
        Operation.Upsert,
        undefined,
        commitTimestamp
    )
}

interface RecordedFetch {
    readonly request: MutationHistoryRequest
    readonly limit: number
}

/**
 * A service whose session answers `getMutationHistory` from the given script, one page per call, and records what
 * was asked.
 */
function scriptedService(pages: MutationHistoryPage[]): { service: CatalogViewerService, fetches: RecordedFetch[] } {
    const fetches: RecordedFetch[] = []
    const session = {
        getMutationHistory: async (request: MutationHistoryRequest, limit: number): Promise<MutationHistoryPage> => {
            fetches.push({ request, limit })
            const page: MutationHistoryPage | undefined = pages[fetches.length - 1]
            if (page == undefined) {
                throw new Error('The scan fetched more capture pages than the script holds.')
            }
            return page
        }
    }
    const evitaClient = {
        queryCatalog: async <T>(_catalogName: string, query: (session: unknown) => Promise<T>): Promise<T> =>
            await query(session)
    } as unknown as EvitaClient
    return { service: new CatalogViewerService(evitaClient), fetches }
}

describe('CatalogViewerService.getCatalogVersions', () => {

    test('Should assemble one capture page into versions, newest first', async () => {
        const { service, fetches } = scriptedService([
            // a short page — the whole retained history fits into one fetch
            new MutationHistoryPage(ImmutableList([
                lead(5, 2), capture(5, 2), capture(5, 1),
                lead(4, 1), capture(4, 1)
            ]), 4)
        ])

        const versions = await service.getCatalogVersions('catalog', undefined, 25)

        expect(versions.map(it => it.version).toArray()).toEqual([5, 4])
        expect(fetches).toHaveLength(1)
        expect(fetches[0]?.request.sinceVersion).toBeUndefined()
        expect(fetches[0]?.limit).toBe(250)
    })

    test('Should continue below the oldest touched version when bulk transactions exhaust the capture page', async () => {
        // page size 2 = capture limit 20; the first full capture page spans only version 10, whose single bulk
        // transaction holds more captures than the page — the old single-fetch behaviour returned one version and
        // let the table declare the end of history
        const firstPage: ChangeCatalogCapture[] = [lead(10, 30)]
        for (let index = 30; firstPage.length < 20; index--) {
            firstPage.push(capture(10, index))
        }
        const { service, fetches } = scriptedService([
            new MutationHistoryPage(ImmutableList(firstPage), 20),
            new MutationHistoryPage(ImmutableList([
                lead(9, 1), capture(9, 1)
            ]), 2)
        ])

        const versions = await service.getCatalogVersions('catalog', undefined, 2)

        expect(versions.map(it => it.version).toArray()).toEqual([10, 9])
        expect(fetches).toHaveLength(2)
        // the second fetch resumes right below version 10, whose lead the first page already delivered
        expect(fetches[1]?.request.sinceVersion).toBe(9)
        expect(fetches[1]?.request.sinceIndex).toBe(reverseScanStartIndex)
    })

    test('Should stop once the requested number of versions is assembled', async () => {
        const records: ChangeCatalogCapture[] = []
        for (let version = 20; version >= 11; version--) {
            records.push(lead(version, 1), capture(version, 1))
        }
        const { service, fetches } = scriptedService([
            new MutationHistoryPage(ImmutableList(records), 20)
        ])

        const versions = await service.getCatalogVersions('catalog', undefined, 2)

        expect(versions.map(it => it.version).toArray()).toEqual([20, 19])
        expect(fetches).toHaveLength(1)
    })

    test('Should stop at version 1 even when the capture page came back full', async () => {
        const firstPage: ChangeCatalogCapture[] = [lead(1, 30)]
        for (let index = 30; firstPage.length < 20; index--) {
            firstPage.push(capture(1, index))
        }
        const { service, fetches } = scriptedService([
            new MutationHistoryPage(ImmutableList(firstPage), 20)
        ])

        const versions = await service.getCatalogVersions('catalog', undefined, 2)

        expect(versions.map(it => it.version).toArray()).toEqual([1])
        expect(fetches).toHaveLength(1)
    })
})

/**
 * `restoreCatalogToVersion` is the only write the service issues, and the wire call has two conventions the dialog
 * must not have to know: the version travels as a 64-bit integer, and a target equal to the source is sent unset so
 * the server applies its own default rather than being told to replace a catalog "with itself".
 */
describe('CatalogViewerService.restoreCatalogToVersion', () => {

    interface RecordedRestore {
        readonly catalogName: string
        readonly catalogVersion: bigint | undefined
        readonly pastMoment: unknown
        readonly targetCatalogName: string | undefined
    }

    function recordingService(): { service: CatalogViewerService, restores: RecordedRestore[] } {
        const restores: RecordedRestore[] = []
        const evitaClient = {
            management: {
                restoreCatalogToVersion: async (
                    catalogName: string,
                    catalogVersion: bigint | undefined,
                    pastMoment: unknown,
                    targetCatalogName: string | undefined
                ): Promise<unknown> => {
                    restores.push({ catalogName, catalogVersion, pastMoment, targetCatalogName })
                    return {}
                }
            }
        } as unknown as EvitaClient
        return { service: new CatalogViewerService(evitaClient), restores }
    }

    test('Should send the version as a 64-bit integer and no moment', async () => {
        const { service, restores } = recordingService()

        await service.restoreCatalogToVersion('catalog', 42, 'other')

        expect(restores).toHaveLength(1)
        expect(restores[0]?.catalogName).toBe('catalog')
        expect(restores[0]?.catalogVersion).toBe(42n)
        expect(restores[0]?.pastMoment).toBeUndefined()
        expect(restores[0]?.targetCatalogName).toBe('other')
    })

    test('Should leave the target unset when it names the source catalog itself', async () => {
        const { service, restores } = recordingService()

        await service.restoreCatalogToVersion('catalog', 42, 'catalog')

        expect(restores[0]?.targetCatalogName).toBeUndefined()
    })
})

/**
 * `followTask` is what turns the restore button into a progress reading: it polls one task until the server reports
 * it ended, and it must stop — without a further read — when the table that follows it goes away.
 */
describe('CatalogViewerService.followTask', () => {

    const pollingInterval: number = 1000
    const taskId: Uuid = Uuid.fromCode('3f2504e0-4f89-11d3-9a0c-0305e82c3301')

    beforeEach(() => vi.useFakeTimers())
    afterEach(() => vi.useRealTimers())

    function status(state: TaskState, progress: number): TaskStatus {
        return new TaskStatus(
            ImmutableList(['RestoreCatalogToVersionTask']),
            'Restoring',
            taskId,
            'catalog',
            commitTimestamp,
            undefined,
            undefined,
            undefined,
            progress,
            '',
            undefined,
            undefined,
            state,
            ImmutableSet()
        )
    }

    function pollingService(statuses: (TaskStatus | undefined)[]): { service: CatalogViewerService, reads: number[] } {
        const reads: number[] = []
        const evitaClient = {
            management: {
                getTaskStatus: async (): Promise<TaskStatus | undefined> => {
                    reads.push(Date.now())
                    return statuses[reads.length - 1]
                }
            }
        } as unknown as EvitaClient
        return { service: new CatalogViewerService(evitaClient), reads }
    }

    /**
     * Drains the generator while advancing the fake clock one interval per read.
     */
    async function collect(follow: AsyncIterable<TaskStatus>, ticks: number): Promise<TaskStatus[]> {
        const seen: TaskStatus[] = []
        const draining: Promise<void> = (async () => {
            for await (const it of follow) {
                seen.push(it)
            }
        })()
        for (let tick = 0; tick < ticks; tick++) {
            await vi.advanceTimersByTimeAsync(pollingInterval)
        }
        await draining
        return seen
    }

    test('Should yield every status read, the terminal one included, then end', async () => {
        const { service, reads } = pollingService([
            status(TaskState.Running, 30),
            status(TaskState.Running, 70),
            status(TaskState.Finished, 100)
        ])

        const seen = await collect(service.followTask(taskId, pollingInterval), 3)

        expect(seen.map(it => it.progress)).toEqual([30, 70, 100])
        expect(seen[2]?.state).toBe(TaskState.Finished)
        expect(reads).toHaveLength(3)
    })

    test('Should end on a failed task as well', async () => {
        const { service } = pollingService([status(TaskState.Failed, 40)])

        const seen = await collect(service.followTask(taskId, pollingInterval), 1)

        expect(seen).toHaveLength(1)
        expect(seen[0]?.state).toBe(TaskState.Failed)
    })

    test('Should throw when the server no longer knows the task', async () => {
        const { service } = pollingService([undefined])

        const draining: Promise<void> = (async () => {
            for await (const _ of service.followTask(taskId, pollingInterval)) {
                // nothing is expected to arrive
            }
        })()
        // the expectation is attached before the clock moves, so the rejection is never unhandled
        const expectation: Promise<void> = expect(draining).rejects.toThrow(/no longer knows the task/)
        await vi.advanceTimersByTimeAsync(pollingInterval)
        await expectation
    })

    test('Should stop without another read once the signal is aborted', async () => {
        const { service, reads } = pollingService([status(TaskState.Running, 10), status(TaskState.Running, 20)])
        const abort: AbortController = new AbortController()

        const seen: TaskStatus[] = []
        const draining: Promise<void> = (async () => {
            for await (const it of service.followTask(taskId, pollingInterval, abort.signal)) {
                seen.push(it)
            }
        })()
        await vi.advanceTimersByTimeAsync(pollingInterval)
        abort.abort()
        await vi.advanceTimersByTimeAsync(pollingInterval * 3)
        await draining

        expect(seen.map(it => it.progress)).toEqual([10])
        expect(reads).toHaveLength(1)
    })
})
