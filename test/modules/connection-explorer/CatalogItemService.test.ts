import { describe, expect, test, vi } from 'vitest'
import { List as ImmutableList } from 'immutable'
import { CatalogItemService } from '@/modules/connection-explorer/service/CatalogItemService'
import { CatalogStatistics } from '@/modules/database-driver/request-response/CatalogStatistics'
import { CatalogState } from '@/modules/database-driver/request-response/CatalogState'
import { MutationProgressType } from '@/modules/connection-explorer/model/MutationProgressType'
import type { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { Toaster } from '@/modules/notification/service/Toaster'

/**
 * The long-running catalog operations of the connection explorer, and specifically the progress flags they put
 * on a catalog: those live in memory only, so one that outlives its operation cannot be cleared by anything
 * short of a page reload.
 */

const catalogName: string = 'testCatalog'

/** Progress values the fake server reports, in order. */
function clientReporting(...percentages: number[]): EvitaClient {
    return {
        activateCatalogWithProgress: async function* () {
            for (const progressInPercent of percentages) {
                yield { progressInPercent }
            }
        },
        management: {
            clearCatalogStatisticsCache: async () => {}
        },
        clearCache: async () => {}
    } as unknown as EvitaClient
}

/** A client whose progress stream fails part way through. */
function failingClient(): EvitaClient {
    return {
        activateCatalogWithProgress: async function* () {
            yield { progressInPercent: 30 }
            throw new Error('Server unreachable.')
        },
        management: {
            clearCatalogStatisticsCache: async () => {}
        },
        clearCache: async () => {}
    } as unknown as EvitaClient
}

function silentToaster(): Toaster {
    return {
        success: vi.fn(async () => {}),
        error: vi.fn(async () => {}),
        info: vi.fn(async () => {}),
        warning: vi.fn(async () => {})
    } as unknown as Toaster
}

function catalog(): CatalogStatistics {
    return new CatalogStatistics(
        'id',
        1n,
        catalogName,
        ImmutableList(),
        CatalogState.Inactive,
        0n,
        0n,
        0n,
        false,
        false
    )
}

/** Lets the fire-and-forget operation started by the service run to completion. */
async function settle(): Promise<void> {
    for (let i = 0; i < 20; i++) {
        await Promise.resolve()
    }
}

describe('progress flags', () => {
    test('drops the flag when the stream ends below 100 %', async () => {
        const target: CatalogStatistics = catalog()
        const service: CatalogItemService = new CatalogItemService(clientReporting(30, 99), silentToaster())

        service.activateCatalogWithProgress(target)
        await settle()

        // an operation whose last reported progress was 99 % is over just as much as one that reported 100 %,
        // and the flag has to go with it - otherwise the catalog reads "Activating - 99%" until a page reload
        expect(target.progresses.has(MutationProgressType.Activation)).toBe(false)
    })

    test('drops the flag when the stream reaches 100 %', async () => {
        const target: CatalogStatistics = catalog()
        const service: CatalogItemService = new CatalogItemService(clientReporting(50, 100), silentToaster())

        service.activateCatalogWithProgress(target)
        await settle()

        expect(target.progresses.has(MutationProgressType.Activation)).toBe(false)
    })

    test('drops the flag when the operation fails', async () => {
        const target: CatalogStatistics = catalog()
        const toaster: Toaster = silentToaster()
        const service: CatalogItemService = new CatalogItemService(failingClient(), toaster)

        service.activateCatalogWithProgress(target)
        await settle()

        expect(target.progresses.has(MutationProgressType.Activation)).toBe(false)
        expect(toaster.error).toHaveBeenCalledTimes(1)
    })

    test('reports progress while the operation runs', async () => {
        const target: CatalogStatistics = catalog()
        let release: () => void = () => {}
        const held: Promise<void> = new Promise<void>(resolve => release = resolve)
        const client: EvitaClient = {
            activateCatalogWithProgress: async function* () {
                yield { progressInPercent: 42 }
                await held
            },
            management: { clearCatalogStatisticsCache: async () => {} },
            clearCache: async () => {}
        } as unknown as EvitaClient
        const service: CatalogItemService = new CatalogItemService(client, silentToaster())

        service.activateCatalogWithProgress(target)
        await settle()

        expect(target.progresses.get(MutationProgressType.Activation)).toBe(42)

        release()
        await settle()
        expect(target.progresses.has(MutationProgressType.Activation)).toBe(false)
    })
})
