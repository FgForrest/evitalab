import { List as ImmutableList } from 'immutable'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime'
import { Duration } from 'luxon'
import { i18n } from '@/vue-plugins/i18n'
import { formatByteSize, formatCount } from '@/utils/string'
import type { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import type {
    MutationHistoryMetadataItemContext
} from '@/modules/history-viewer/model/MutationHistoryMetadataItemContext.ts'

/**
 * Defines how a particular traffic record should be displayed in UI
 */
export class MutationHistoryItemVisualisationDefinition {

    readonly source: ChangeCatalogCapture

    readonly icon: string|undefined
    readonly title: string
    readonly details?: string
    metadata: MetadataGroup[]
    readonly actions: ImmutableList<Action>
    private readonly _children: MutationHistoryItemVisualisationDefinition[] = []

    constructor(source: ChangeCatalogCapture,
                icon: string | undefined,
                title: string,
                details: string | undefined,
                metadata: MetadataGroup[], actions: Immutable.List<Action>) {
        this.source = source
        this.icon = icon
        this.title = title
        this.details = details
        this.metadata = metadata
        this.actions = actions
    }

    addChild(childRecord: MutationHistoryItemVisualisationDefinition): void {
        this._children.push(childRecord)
    }

    get children(): ImmutableList<MutationHistoryItemVisualisationDefinition> {
        return ImmutableList(this._children)
    }

    get defaultMetadata(): MetadataGroup | undefined {
        return this.metadata.find(group => group.identifier === defaultMetadataGroupIdentifier)
    }
}

export const metadataItemSessionIdIdentifier: string = 'sessionId'
export const metadataItemCreatedIdentifier: string = 'created'
export const metadataItemDurationIdentifier: string = 'duration'
export const metadataItemIoFetchedSizeBytesIdentifier: string = 'ioFetchedSizeBytes'
export const metadataItemIoFetchCountIdentifier: string = 'ioFetchCount'
export const metadataItemFinishedStatusIdentifier: string = 'finishedStatus'

export class MetadataItem {
    readonly identifier: string | undefined
    readonly icon: string
    readonly tooltip: string
    readonly value: string
    readonly severity: MetadataItemSeverity
    readonly details?: string
    readonly onClickCallback?: (ctx: MutationHistoryMetadataItemContext) => void

    constructor(identifier: string | undefined,
                icon: string,
                tooltip: string,
                value: string,
                severity?: MetadataItemSeverity,
                details?: string,
                onClickCallback?: (ctx: MutationHistoryMetadataItemContext) => void) {
        this.identifier = identifier
        this.icon = icon
        this.tooltip = tooltip
        this.value = value
        this.severity = severity || MetadataItemSeverity.Info
        this.details = details
        this.onClickCallback = onClickCallback
    }

    static area(area: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            area === 'infrastructure' ? 'mdi-graph-outline' : 'mdi-table',
            i18n.global.t('mutationHistoryViewer.record.type.area.tooltip'),
            area?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    // todo vstupuje sem i transaction
    static operation(operationType: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('mutationHistoryViewer.record.type.operation.tooltip'),
            operationType?.toString(),
            operationType === 'remove' ? MetadataItemSeverity.Error : MetadataItemSeverity.Success,
            undefined,
            undefined
        )
    }


    static entityType(sessionId: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('mutationHistoryViewer.record.type.entityType.tooltip'),
            sessionId?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static version(sessionId: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('mutationHistoryViewer.record.type.version.tooltip'),
            sessionId?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static entityPrimaryKey(sessionId: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('mutationHistoryViewer.record.type.entityPrimaryKey.tooltip'),
            sessionId?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static index(sessionId: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('mutationHistoryViewer.record.type.index.tooltip'),
            sessionId?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }



    static sessionId(sessionId: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.sessionId.tooltip'),
            sessionId?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static created(created: OffsetDateTime): MetadataItem {
        return new MetadataItem(
            metadataItemCreatedIdentifier,
            'mdi-clock-outline',
            i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.created.tooltip'),
            created.getPrettyPrintableString(),
            MetadataItemSeverity.Info,
            undefined,
            (ctx: MutationHistoryMetadataItemContext): void => {
                navigator.clipboard.writeText(`${created.toString()}`).then(() => {
                    ctx.toaster.info(i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.created.notification.copiedToClipboard'))
                        .then()
                }).catch(() => {
                    ctx.toaster.error(i18n.global.t('common.notification.failedToCopyToClipboard'))
                        .then()
                })
            }
        )
    }



    static duration(duration: Duration,
                    thresholds?: [number, number]): MetadataItem {
        const durationInMillis: number = duration.toMillis()
        let durationIndicator: MetadataItemSeverity = MetadataItemSeverity.Success
        if (thresholds != undefined) {
            if (durationInMillis > thresholds[1]) {
                durationIndicator = MetadataItemSeverity.Error
            } else if (durationInMillis > thresholds[0]) {
                durationIndicator = MetadataItemSeverity.Warning
            }
        }

        return new MetadataItem(
            metadataItemDurationIdentifier,
            'mdi-timer-outline',
            i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.duration'),
            // note: typescript cannot comprehend that there is luxon extensions that overrides it...
            // @ts-ignore
            duration.toShortHuman(),
            durationIndicator
        )
    }

    static ioFetchedSizeBytes(ioFetchedSizeBytes: number): MetadataItem {
        return new MetadataItem(
            metadataItemIoFetchedSizeBytesIdentifier,
            'mdi-download-network-outline',
            i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.ioFetchedSizeBytes.tooltip'),
            i18n.global.t(
                'trafficViewer.recordHistory.record.type.common.metadata.item.ioFetchedSizeBytes.value',
                // @ts-ignore
                ioFetchedSizeBytes,
                { named: { count: formatByteSize(ioFetchedSizeBytes) } }
            )
        )
    }

    static ioFetchCount(ioFetchCount: number): MetadataItem {
        return new MetadataItem(
            metadataItemIoFetchCountIdentifier,
            'mdi-download-network-outline',
            i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.ioFetchCount.tooltip'),
            i18n.global.t(
                'trafficViewer.recordHistory.record.type.common.metadata.item.ioFetchCount.value',
                { count: formatCount(ioFetchCount) }
            )
        )
    }

    static finishedStatus(finishedWithError: string | undefined): MetadataItem {
        if (finishedWithError == undefined) {
            return new MetadataItem(
                metadataItemFinishedStatusIdentifier,
                'mdi-check',
                i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.finishedStatus.tooltip.success'),
                i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.finishedStatus.status.success'),
                MetadataItemSeverity.Success
            )
        } else {
            return new MetadataItem(
                metadataItemFinishedStatusIdentifier,
                'mdi-alert-circle-outline',
                i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.finishedStatus.tooltip.error', { error: JSON.stringify(finishedWithError) }),
                i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.finishedStatus.status.error'),
                MetadataItemSeverity.Error
            )
        }
    }
}

export const defaultMetadataGroupIdentifier: string = 'default'

export class MetadataGroup {

    readonly identifier?: string
    readonly icon: string
    readonly tooltip: string
    readonly title?: string
    items: MetadataItem[]

    constructor(identifier: string | undefined, icon: string, tooltip: string, title: string | undefined, items: MetadataItem[]) {
        this.identifier = identifier
        this.icon = icon
        this.tooltip = tooltip
        this.title = title
        this.items = items
    }

    static default(items: MetadataItem[]): MetadataGroup {
        return new MetadataGroup(
            defaultMetadataGroupIdentifier,
            'mdi-format-list-bulleted',
            i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.group.default'),
            undefined,
            items
        )
    }
}

export enum MetadataItemSeverity {
    Success = 'success',
    Warning = 'warning',
    Error = 'error',
    Info = 'info'
}

export class Action {
    readonly title: string
    readonly icon: string
    readonly callback?: () => void

    constructor(title: string, icon: string, callback?: (() => void) | undefined) {
        this.title = title
        this.icon = icon
        this.callback = callback
    }
}
