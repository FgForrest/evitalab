import { test, expect, describe } from 'vitest'
import { List as ImmutableList } from 'immutable'
import {
    mergeTransactionOverviews,
    MutationHistoryPage,
    truncateBelowBoundary
} from '@/modules/database-driver/request-response/cdc/MutationHistoryPage'
import { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture'
import { CaptureArea } from '@/modules/database-driver/request-response/cdc/CaptureArea'
import { Operation } from '@/modules/database-driver/request-response/cdc/Operation'
import { TransactionMutation } from '@/modules/database-driver/request-response/transaction/TransactionMutation'
import { OffsetDateTime, Timestamp } from '@/modules/database-driver/data-type/OffsetDateTime'

function capture(version: number, index: number = 1): ChangeCatalogCapture {
    return new ChangeCatalogCapture(
        version,
        index,
        CaptureArea.Data,
        'Product',
        1,
        Operation.Upsert,
        undefined,
        undefined
    )
}

/**
 * A capture delivered by the stream whose body is a transaction mutation. Once the server's inverse
 * converter populates infrastructure bodies, such captures are indistinguishable by type from the
 * locally synthesised transaction overviews — only their provenance separates them.
 */
function streamedInfrastructureCapture(version: number): ChangeCatalogCapture {
    return new ChangeCatalogCapture(
        version,
        1,
        CaptureArea.Infrastructure,
        undefined,
        undefined,
        Operation.Transaction,
        new TransactionMutation(
            '00000000-0000-0000-0000-000000000000',
            version,
            1,
            1,
            new OffsetDateTime(new Timestamp(BigInt(0), 0), 'Z')
        ),
        undefined
    )
}

function transactionOverview(version: number): ChangeCatalogCapture {
    return new ChangeCatalogCapture(
        version,
        0,
        CaptureArea.Infrastructure,
        undefined,
        undefined,
        Operation.Transaction,
        undefined,
        undefined
    )
}

describe('truncateBelowBoundary', () => {
    test('cuts reverse-ordered captures at the exclusive boundary', () => {
        const captures: ChangeCatalogCapture[] = [capture(9), capture(8), capture(7), capture(5)]

        expect(truncateBelowBoundary(captures, 7).map(c => c.version)).toEqual([9, 8])
    })

    test('is a no-op without a boundary', () => {
        const captures: ChangeCatalogCapture[] = [capture(9), capture(7)]

        expect(truncateBelowBoundary(captures, undefined)).toBe(captures)
    })

    test('yields nothing when the boundary is the newest version', () => {
        const captures: ChangeCatalogCapture[] = [capture(9), capture(9), capture(7)]

        expect(truncateBelowBoundary(captures, 9)).toEqual([])
    })

    test('keeps everything when the boundary is older than the whole page', () => {
        const captures: ChangeCatalogCapture[] = [capture(9), capture(7)]

        expect(truncateBelowBoundary(captures, 3).map(c => c.version)).toEqual([9, 7])
    })
})

describe('mergeTransactionOverviews', () => {
    test('interleaves overviews by version instead of prepending them as a block', () => {
        const merged: ChangeCatalogCapture[] = mergeTransactionOverviews(
            [capture(9), capture(9), capture(7)],
            [transactionOverview(7), transactionOverview(9)]
        )

        expect(merged.map(c => [c.version, c.index])).toEqual([[9, 0], [9, 1], [9, 1], [7, 0], [7, 1]])
    })

    // load bearing beyond the grouping contract: MutationHistoryTransactionVisualiser keeps the first transaction
    // capture of a version, so this ordering is what makes the overview — and not the streamed lead event — the
    // record a transaction row is rendered from
    test('lets an overview lead its own version', () => {
        const merged: ChangeCatalogCapture[] = mergeTransactionOverviews(
            [capture(9)],
            [transactionOverview(9)]
        )

        expect(merged[0]?.index).toEqual(0)
        expect(merged[0]?.operation).toEqual(Operation.Transaction)
    })

    test('drops overviews of versions absent from the captures', () => {
        const merged: ChangeCatalogCapture[] = mergeTransactionOverviews(
            [capture(9)],
            [transactionOverview(9), transactionOverview(4)]
        )

        expect(merged.map(c => c.version)).toEqual([9, 9])
    })

    test('keeps the captures untouched when there are no overviews', () => {
        const captures: ChangeCatalogCapture[] = [capture(9)]

        expect(mergeTransactionOverviews(captures, [])).toBe(captures)
    })
})

describe('MutationHistoryPage.captureCount', () => {
    test('counts only streamed captures, not the merged overviews', () => {
        const captures: ChangeCatalogCapture[] = [capture(9), capture(7)]
        const merged: ChangeCatalogCapture[] = mergeTransactionOverviews(
            captures,
            [transactionOverview(9), transactionOverview(7)]
        )

        const page: MutationHistoryPage = new MutationHistoryPage(ImmutableList(merged), captures.length)

        expect(page.records.size).toEqual(4)
        expect(page.captureCount).toEqual(2)
    })

    // regression guard: a capture carrying a TransactionMutation body may legitimately arrive from the
    // stream, so the count must never be derived from the body type
    test('counts a streamed capture whose body is a transaction mutation', () => {
        const captures: ChangeCatalogCapture[] = [capture(9), streamedInfrastructureCapture(9)]
        const merged: ChangeCatalogCapture[] = mergeTransactionOverviews(captures, [transactionOverview(9)])

        const page: MutationHistoryPage = new MutationHistoryPage(ImmutableList(merged), captures.length)

        expect(page.captureCount).toEqual(2)
        expect(page.records.size).toEqual(3)
    })
})
