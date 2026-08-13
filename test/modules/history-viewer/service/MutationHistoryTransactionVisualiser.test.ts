import { expect, test, vi } from 'vitest'
import { List as ImmutableList } from 'immutable'
import {
    MutationHistoryTransactionVisualiser
} from '@/modules/history-viewer/service/MutationHistoryTransactionVisualiser'
import {
    MutationHistorySchemaVisualiser
} from '@/modules/history-viewer/service/MutationHistorySchemaVisualiser'
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
import { TransactionMutation } from '@/modules/database-driver/request-response/transaction/TransactionMutation'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import {
    ModifyEntitySchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/catalog/ModifyEntitySchemaMutation'
import { GrpcChangeCaptureContainerType } from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb'

/**
 * A page of mutation history carries two transaction captures of the same catalog version — the overview synthesised
 * by the driver and the streamed lead event — and the transaction visualiser used to build a full record for both,
 * relying on the context to swallow the second one.
 *
 * The nested capture is a schema one, the data visualiser cannot be instantiated without a DOM.
 */

const version: number = 9

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

function transactionCapture(transactionId: string): ChangeCatalogCapture {
    return new ChangeCatalogCapture(
        version,
        0,
        CaptureArea.Infrastructure,
        undefined,
        undefined,
        Operation.Transaction,
        new TransactionMutation(
            transactionId,
            version,
            1,
            256,
            OffsetDateTime.of(BigInt(1_700_000_000), 0, '+00:00')
        ),
        undefined
    )
}

function schemaCapture(): ChangeCatalogCapture {
    return new ChangeCatalogCapture(
        version,
        1,
        CaptureArea.Schema,
        'product',
        undefined,
        Operation.Upsert,
        new ModifyEntitySchemaMutation('product', ImmutableList()),
        undefined
    )
}

/**
 * Visualises a page in the order the driver produces it: the synthesised overview leads its version, the streamed
 * captures follow, and the streamed transaction lead event closes the version block.
 */
function visualisePage(ctx: MutationHistoryVisualisationContext): void {
    const transactionVisualiser: MutationHistoryTransactionVisualiser = new MutationHistoryTransactionVisualiser()
    const schemaVisualiser: MutationHistorySchemaVisualiser = new MutationHistorySchemaVisualiser()

    transactionVisualiser.visualise(ctx, transactionCapture('overview'))
    schemaVisualiser.visualise(ctx, schemaCapture())
    transactionVisualiser.visualise(ctx, transactionCapture('streamed-lead-event'))
}

test('Should render a single row for a version reported by two transaction captures', () => {
    const ctx: MutationHistoryVisualisationContext = context()

    visualisePage(ctx)

    const records: ImmutableList<MutationHistoryItemVisualisationDefinition> = ctx.getVisualisedRecords()
    expect(records.size).toEqual(1)
})

test('Should keep the first transaction capture of a version, which is the overview', () => {
    const ctx: MutationHistoryVisualisationContext = context()

    visualisePage(ctx)

    const transactionRecord: MutationHistoryItemVisualisationDefinition = ctx.getVisualisedRecords().get(0)!
    expect((transactionRecord.source.body as TransactionMutation).transactionId).toEqual('overview')
})

test('Should nest the captures of a version under the visualised transaction record', () => {
    const ctx: MutationHistoryVisualisationContext = context()

    visualisePage(ctx)

    const transactionRecord: MutationHistoryItemVisualisationDefinition = ctx.getVisualisedRecords().get(0)!
    expect(transactionRecord.children.size).toEqual(1)
})

test('Should not replace the record the captures of a version nest under', () => {
    const ctx: MutationHistoryVisualisationContext = context()
    const transactionVisualiser: MutationHistoryTransactionVisualiser = new MutationHistoryTransactionVisualiser()

    transactionVisualiser.visualise(ctx, transactionCapture('overview'))
    const visualisedRecord: MutationHistoryItemVisualisationDefinition = ctx.getVisualisedSessionRecord(version)!
    transactionVisualiser.visualise(ctx, transactionCapture('streamed-lead-event'))

    expect(ctx.getVisualisedSessionRecord(version)).toBe(visualisedRecord)
    expect(ctx.getVisualisedRecords().get(0)).toBe(visualisedRecord)
})

test('Should not build a definition for a version that is already visualised', () => {
    const ctx: MutationHistoryVisualisationContext = context()
    const transactionVisualiser: MutationHistoryTransactionVisualiser = new MutationHistoryTransactionVisualiser()
    // the duplicate used to be fully built — titles, metadata, clipboard callbacks — only to be dropped by the context
    const constructMetadata = vi.spyOn(
        transactionVisualiser as unknown as { constructMetadata: (capture: ChangeCatalogCapture) => unknown },
        'constructMetadata'
    )

    transactionVisualiser.visualise(ctx, transactionCapture('overview'))
    transactionVisualiser.visualise(ctx, transactionCapture('streamed-lead-event'))

    expect(constructMetadata).toHaveBeenCalledTimes(1)
})
