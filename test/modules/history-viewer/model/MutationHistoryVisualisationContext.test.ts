import { expect, test } from 'vitest'
import { List as ImmutableList } from 'immutable'
import {
    MutationHistoryVisualisationContext
} from '@/modules/history-viewer/model/MutationHistoryVisualisationContext'
import { MutationHistoryCriteria } from '@/modules/history-viewer/model/MutationHistoryCriteria'
import {
    MutationHistoryItemVisualisationDefinition
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition'
import { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture'
import { CaptureArea } from '@/modules/database-driver/request-response/cdc/CaptureArea'
import { Operation } from '@/modules/database-driver/request-response/cdc/Operation'
import type { Mutation } from '@/modules/database-driver/request-response/Mutation'
import {
    InsertReferenceMutation
} from '@/modules/database-driver/request-response/data/mutation/reference/InsertReferenceMutation'
import { ReferenceKey } from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKey'
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality'
import { GrpcChangeCaptureContainerType } from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb'

/**
 * Root records used to be indexed under a key that did not match the key their presence was tested against, so
 * reference mutations of the same entity and catalog version silently overwrote each other.
 */

function context(): MutationHistoryVisualisationContext {
    // entity container type makes all root records pass the output filtering
    const criteria: MutationHistoryCriteria = new MutationHistoryCriteria(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        [GrpcChangeCaptureContainerType.CONTAINER_ENTITY]
    )
    return new MutationHistoryVisualisationContext('testCatalog', criteria)
}

function record(version: number, body: Mutation | undefined): MutationHistoryItemVisualisationDefinition {
    const capture: ChangeCatalogCapture = new ChangeCatalogCapture(
        version,
        0,
        CaptureArea.Data,
        'product',
        1,
        Operation.Upsert,
        body,
        undefined
    )
    return new MutationHistoryItemVisualisationDefinition(
        capture,
        undefined,
        `record of version ${version}`,
        undefined,
        undefined,
        [],
        ImmutableList()
    )
}

function referenceRecord(version: number,
                         referenceName: string,
                         referencedPrimaryKey: number): MutationHistoryItemVisualisationDefinition {
    return record(
        version,
        new InsertReferenceMutation(
            new ReferenceKey(referenceName, referencedPrimaryKey),
            Cardinality.ZeroOrMore,
            'brand'
        )
    )
}

test('Should keep references of the same entity and version apart', () => {
    const ctx: MutationHistoryVisualisationContext = context()

    ctx.addRootVisualisedRecord(referenceRecord(1, 'brand', 10))
    ctx.addRootVisualisedRecord(referenceRecord(1, 'categories', 10))

    expect(ctx.getVisualisedRecords().size).toEqual(2)
})

test('Should deduplicate the same reference of the same entity and version', () => {
    const ctx: MutationHistoryVisualisationContext = context()

    ctx.addRootVisualisedRecord(referenceRecord(1, 'brand', 10))
    ctx.addRootVisualisedRecord(referenceRecord(1, 'brand', 10))
    ctx.addRootVisualisedRecord(referenceRecord(1, 'brand', 20))

    expect(ctx.getVisualisedRecords().size).toEqual(2)
})

test('Should deduplicate non-reference records by catalog version', () => {
    const ctx: MutationHistoryVisualisationContext = context()

    ctx.addRootVisualisedRecord(record(1, undefined))
    ctx.addRootVisualisedRecord(record(1, undefined))
    ctx.addRootVisualisedRecord(record(2, undefined))

    expect(ctx.getVisualisedRecords().size).toEqual(2)
})

test('Should keep the first record of an identity, not the last one', () => {
    const ctx: MutationHistoryVisualisationContext = context()

    const first: MutationHistoryItemVisualisationDefinition = record(1, undefined)
    ctx.addRootVisualisedRecord(first)
    ctx.addRootVisualisedRecord(record(1, undefined))

    expect(ctx.getVisualisedRecords().get(0)).toBe(first)
})

test('Should report the record held under an identity back to the caller', () => {
    const ctx: MutationHistoryVisualisationContext = context()

    const first: MutationHistoryItemVisualisationDefinition = record(1, undefined)
    const duplicate: MutationHistoryItemVisualisationDefinition = record(1, undefined)

    expect(ctx.addRootVisualisedRecord(first)).toBe(first)
    expect(ctx.addRootVisualisedRecord(duplicate)).toBe(first)
})

test('Should keep the first record nested under a catalog version, not the last one', () => {
    const ctx: MutationHistoryVisualisationContext = context()

    const first: MutationHistoryItemVisualisationDefinition = record(1, undefined)
    ctx.addVisualisedSessionRecord(1, first)
    ctx.addVisualisedSessionRecord(1, record(1, undefined))

    expect(ctx.getVisualisedSessionRecord(1)).toBe(first)
})
