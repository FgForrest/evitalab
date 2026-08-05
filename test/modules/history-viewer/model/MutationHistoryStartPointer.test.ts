import { test, expect, describe } from 'vitest'
import {
    hasMoreRecords,
    MutationHistoryStartPointer,
    selectNewestVersion
} from '@/modules/history-viewer/model/MutationHistoryStartPointer'
import { truncateBelowBoundary } from '@/modules/database-driver/request-response/cdc/MutationHistoryPage'
import { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture'
import { CaptureArea } from '@/modules/database-driver/request-response/cdc/CaptureArea'
import { Operation } from '@/modules/database-driver/request-response/cdc/Operation'

function capture(version: number): ChangeCatalogCapture {
    return new ChangeCatalogCapture(
        version,
        1,
        CaptureArea.Data,
        'Product',
        1,
        Operation.Upsert,
        undefined,
        undefined
    )
}

describe('selectNewestVersion', () => {
    test('picks the newest version among the held records', () => {
        expect(selectNewestVersion([capture(7), capture(5), capture(5)])).toEqual(7)
    })

    // the merged transaction overviews are not in the server's reverse order, so the newest version
    // must not be read off the first record
    test('ignores the position of the records', () => {
        expect(selectNewestVersion([capture(5), capture(9), capture(7)])).toEqual(9)
    })

    test('has no boundary to offer for an empty list', () => {
        expect(selectNewestVersion([])).toBeUndefined()
    })
})

describe('start pointer boundary', () => {
    // the reported symptom: the pointer used to be set to newest + 1, which the server clamped back to
    // the current catalog version and answered with the entire history
    test('keeps only records strictly newer than the newest held record', () => {
        const held: ChangeCatalogCapture[] = [capture(7), capture(5), capture(5)]
        const pointer: MutationHistoryStartPointer =
            new MutationHistoryStartPointer(selectNewestVersion(held)!)

        expect(pointer.newerThanVersion).toEqual(7)

        const nextLoad: ChangeCatalogCapture[] = [capture(9), capture(7)]
        expect(truncateBelowBoundary(nextLoad, pointer.newerThanVersion).map(c => c.version))
            .toEqual([9])
    })
})

describe('hasMoreRecords', () => {
    test('offers loading more before the first fetch', () => {
        expect(hasMoreRecords(undefined, 20)).toBe(true)
    })

    test('offers loading more on a full page', () => {
        expect(hasMoreRecords(20, 20)).toBe(true)
    })

    test('hides loading more on a partial page', () => {
        expect(hasMoreRecords(19, 20)).toBe(false)
        expect(hasMoreRecords(0, 20)).toBe(false)
    })
})
