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
    Action,
    MetadataGroup,
    MetadataItem, metadataItemCreatedIdentifier, metadataItemIoFetchCountIdentifier, MetadataItemSeverity,
    MutationHistoryItemVisualisationDefinition
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'
import { CaptureArea } from '@/modules/database-driver/request-response/cdc/CaptureArea.ts'
import { TransactionMutation } from '@/modules/database-driver/request-response/transaction/TransactionMutation.ts'
import { formatCount } from '@/utils/string.ts'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'
import type {
    MutationHistoryMetadataItemContext
} from '@/modules/history-viewer/model/MutationHistoryMetadataItemContext.ts'

/**
 * Visualises entity enrichment container.
 */
export class MutationHistoryTransactionVisualiser extends MutationVisualiser<ChangeCatalogCapture> {

    private readonly workspaceService: WorkspaceService
    private readonly evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory

    constructor(workspaceService: WorkspaceService, evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory) {
        super()
        this.workspaceService = workspaceService
        this.evitaQLConsoleTabFactory = evitaQLConsoleTabFactory
    }

    canVisualise(trafficRecord: ChangeCatalogCapture): boolean {
        return  trafficRecord.area == CaptureArea.Infrastructure // todo pfi: better condition
    }

    visualise(ctx: MutationHistoryVisualisationContext, mutationHistory: ChangeCatalogCapture): void {
        const visualisedSessionRecord: MutationHistoryItemVisualisationDefinition | undefined = ctx.getVisualisedSessionRecord(mutationHistory.version)

        const visualisedRecord: MutationHistoryItemVisualisationDefinition = new MutationHistoryItemVisualisationDefinition(
            mutationHistory,
            i18n.global.t('mutationHistoryViewer.record.type.transaction.title', { version: mutationHistory.version }),
            undefined,
            this.constructMetadata(mutationHistory, visualisedSessionRecord),
            ImmutableList()
        )


        ctx.addVisualisedSessionRecord(mutationHistory.version, visualisedRecord)
        ctx.addRootVisualisedRecord(visualisedRecord)
    }

    private constructMetadata(trafficRecord: ChangeCatalogCapture,
                              visualisedSessionRecord: MutationHistoryItemVisualisationDefinition | undefined): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        defaultMetadata.push(MetadataItem.sessionId(trafficRecord.area))
        defaultMetadata.push(MetadataItem.sessionId(trafficRecord.operation))
        if (trafficRecord.body instanceof TransactionMutation) {
            defaultMetadata.push(MutationHistoryTransactionVisualiser.mutationCount((trafficRecord.body.mutationCount)))
            defaultMetadata.push(MutationHistoryTransactionVisualiser.commitTimestamp((trafficRecord.body.commitTimestamp)))
            defaultMetadata.push(MutationHistoryTransactionVisualiser.transactionId((trafficRecord.body.transactionId)))
            defaultMetadata.push(MutationHistoryTransactionVisualiser.walSizeInBytes((trafficRecord.body.walSizeInBytes)))
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

    static walSizeInBytes(ioFetchCount: number): MetadataItem {
        return new MetadataItem(
            metadataItemIoFetchCountIdentifier,
            'mdi-folder-zip-outline',
            i18n.global.t('mutationHistoryViewer.record.type.transaction.walSizeInBytes.tooltip'),
            i18n.global.t(
                'mutationHistoryViewer.record.type.transaction.walSizeInBytes.value',
                { count: formatCount(ioFetchCount) }
            )
        )
    }

    static mutationCount(ioFetchCount: number): MetadataItem {
        return new MetadataItem(
            metadataItemIoFetchCountIdentifier,
            'mdi-download-network-outline',
            i18n.global.t('mutationHistoryViewer.record.type.transaction.mutationCount.tooltip'),
            i18n.global.t(
                'mutationHistoryViewer.record.type.transaction.mutationCount.value',
                { count: formatCount(ioFetchCount) }
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

    private constructActions(ctx: MutationHistoryVisualisationContext,
                             trafficRecord: ChangeCatalogCapture): ImmutableList<Action> {
        const actions: Action[] = []

        actions.push(new Action(
            i18n.global.t('trafficViewer.recordHistory.record.type.enrichment.action.query'),
            'mdi-play',
            () => this.workspaceService.createTab(
                this.evitaQLConsoleTabFactory.createNew(
                    ctx.catalogName,
                    new EvitaQLConsoleTabData('')
                )
            )
        ))

        return ImmutableList(actions)
    }
}
