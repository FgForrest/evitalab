import { i18n } from '@/vue-plugins/i18n'
import { List as ImmutableList } from 'immutable'
import { EvitaQLConsoleTabData } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabData'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { EvitaQLConsoleTabFactory } from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import { MutationVisualiser } from '@/modules/history-viewer/service/MutationVisualiser.ts'
import {
    MutationHistoryVisualisationContext
} from '@/modules/history-viewer/model/MutationHistoryVisualisationContext.ts'
import {
    MetadataGroup,
    MetadataItem, metadataItemCreatedIdentifier, metadataItemIoFetchCountIdentifier, MetadataItemSeverity,
    MutationHistoryItemVisualisationDefinition
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'
import { CaptureArea } from '@/modules/database-driver/request-response/cdc/CaptureArea.ts'
import { TransactionMutation } from '@/modules/database-driver/request-response/transaction/TransactionMutation.ts'
import { formatByteSize, formatCount } from '@/utils/string.ts'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'
import type {
    MutationHistoryMetadataItemContext
} from '@/modules/history-viewer/model/MutationHistoryMetadataItemContext.ts'

/**
 * Visualises entity enrichment container.
 */
export class MutationHistoryTransactionVisualiser extends MutationVisualiser<ChangeCatalogCapture> {



    constructor() {
        super()

    }

    canVisualise(changeCatalogCapture: ChangeCatalogCapture): boolean {
        return changeCatalogCapture.area == CaptureArea.Infrastructure // todo pfi: better condition
    }

    visualise(ctx: MutationHistoryVisualisationContext, mutationHistory: ChangeCatalogCapture): void {
        const visualisedSessionRecord: MutationHistoryItemVisualisationDefinition | undefined = ctx.getVisualisedSessionRecord(mutationHistory.version)

        const visualisedRecord: MutationHistoryItemVisualisationDefinition = new MutationHistoryItemVisualisationDefinition(mutationHistory, 'mdi-graph-outline', i18n.global.t('mutationHistoryViewer.record.type.transaction.title', { version: mutationHistory.version }), undefined, this.constructMetadata(mutationHistory), ImmutableList())


        ctx.addVisualisedSessionRecord(mutationHistory.version, visualisedRecord)
        ctx.addRootVisualisedRecord(visualisedRecord)
        // Attach any pending data items that arrived without transaction
        ctx.attachPendingChildren(mutationHistory.version, visualisedRecord)
    }

    private constructMetadata(mutationHistory: ChangeCatalogCapture): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        if (mutationHistory.body instanceof TransactionMutation) {
            defaultMetadata.push(MutationHistoryTransactionVisualiser.commitTimestamp((mutationHistory.body.commitTimestamp)))
        }

        defaultMetadata.push(MetadataItem.area(mutationHistory.area))
        defaultMetadata.push(MetadataItem.entityType(mutationHistory.operation))
        if (mutationHistory.body instanceof TransactionMutation) {
            defaultMetadata.push(MutationHistoryTransactionVisualiser.mutationCount((mutationHistory.body.mutationCount)))
            defaultMetadata.push(MutationHistoryTransactionVisualiser.transactionId((mutationHistory.body.transactionId)))
            defaultMetadata.push(MutationHistoryTransactionVisualiser.walSizeInBytes((mutationHistory.body.walSizeInBytes)))
        }

        return [MetadataGroup.default(defaultMetadata)]
    }

    static transactionId(created: string): MetadataItem {
        return new MetadataItem(
            metadataItemCreatedIdentifier,
            'mdi-identifier',
            i18n.global.t('mutationHistoryViewer.record.type.transaction.transactionId.tooltip'),
            created,
            MetadataItemSeverity.Info,
            undefined,
            (ctx: MutationHistoryMetadataItemContext): void => {
                navigator.clipboard.writeText(`${created}`).then(() => {
                    ctx.toaster.info(i18n.global.t('mutationHistoryViewer.record.type.transaction.transactionId.notification.copiedToClipboard'))
                        .then()
                }).catch(() => {
                    ctx.toaster.error(i18n.global.t('common.notification.failedToCopyToClipboard'))
                        .then()
                })
            }
        )
    }

    static walSizeInBytes(wallSizeInBytes: number): MetadataItem {
        return new MetadataItem(
            metadataItemIoFetchCountIdentifier,
            'mdi-folder-zip-outline',
            i18n.global.t('mutationHistoryViewer.record.type.transaction.walSizeInBytes.tooltip'),
            i18n.global.t(
                'mutationHistoryViewer.record.type.transaction.walSizeInBytes.value',
                { wallSizeInBytes: formatByteSize(wallSizeInBytes) }
            )
        )
    }

    static mutationCount(mutationCount: number): MetadataItem {
        return new MetadataItem(
            metadataItemIoFetchCountIdentifier,
            'mdi-download-network-outline',
            i18n.global.t('mutationHistoryViewer.record.type.transaction.mutationCount.tooltip'),
            i18n.global.t(
                'mutationHistoryViewer.record.type.transaction.mutationCount.value',
                { count: formatCount(mutationCount) }
            )
        )
    }

    static commitTimestamp(created: OffsetDateTime): MetadataItem {
        return new MetadataItem(
            metadataItemCreatedIdentifier,
            'mdi-clock-outline',
            i18n.global.t('mutationHistoryViewer.record.type.transaction.commitTimestamp.tooltip'),
            created.getPrettyPrintableString(),
            MetadataItemSeverity.Info,
            undefined,
            (ctx: MutationHistoryMetadataItemContext): void => {
                navigator.clipboard.writeText(`${created.toString()}`).then(() => {
                        ctx.toaster.info(i18n.global.t('mutationHistoryViewer.record.type.transaction.commitTimestamp.notification.copiedToClipboard'))
                        .then()
                }).catch(() => {
                    ctx.toaster.error(i18n.global.t('common.notification.failedToCopyToClipboard'))
                        .then()
                })
            }
        )
    }

}
