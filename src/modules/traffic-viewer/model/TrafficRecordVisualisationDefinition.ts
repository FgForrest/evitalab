import Immutable from 'immutable'
import { OffsetDateTime } from '@/modules/connection/model/data-type/OffsetDateTime'
import { Duration } from 'luxon'
import { i18n } from '@/vue-plugins/i18n'
import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { TrafficRecordMetadataItemContext } from '@/modules/traffic-viewer/model/TrafficRecordMetadataItemContext'
import { formatByteSize, formatCount } from '@/utils/string'
import { Uuid } from '@/modules/connection/model/data-type/Uuid'

/**
 * Defines how a particular traffic record should be displayed in UI
 */
export class TrafficRecordVisualisationDefinition {

    readonly source: TrafficRecord

    readonly title: string
    readonly details?: string
    metadata: MetadataGroup[]
    readonly actions: Immutable.List<Action>
    private readonly _children: TrafficRecordVisualisationDefinition[] = []

    constructor(source: TrafficRecord,
                title: string,
                details: string | undefined,
                metadata: MetadataGroup[],
                actions: Immutable.List<Action>) {
        this.source = source
        this.title = title
        this.details = details
        this.metadata = metadata
        this.actions = actions
    }

    addChild(childRecord: TrafficRecordVisualisationDefinition): void {
        this._children.push(childRecord)
    }

    get children(): Immutable.List<TrafficRecordVisualisationDefinition> {
        return Immutable.List(this._children)
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
    readonly onClickCallback?: (ctx: TrafficRecordMetadataItemContext) => void

    constructor(identifier: string | undefined,
                icon: string,
                tooltip: string,
                value: string,
                severity?: MetadataItemSeverity,
                details?: string,
                onClickCallback?: (ctx: TrafficRecordMetadataItemContext) => void) {
        this.identifier = identifier
        this.icon = icon
        this.tooltip = tooltip
        this.value = value
        this.severity = severity || MetadataItemSeverity.Info
        this.details = details
        this.onClickCallback = onClickCallback
    }

    static sessionId(sessionId: Uuid): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.sessionId.tooltip'),
            sessionId.toString(),
            MetadataItemSeverity.Info,
            undefined,
            (ctx: TrafficRecordMetadataItemContext): void => {
                navigator.clipboard.writeText(`${sessionId.toString()}`).then(() => {
                    ctx.toaster.info(i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.sessionId.notification.copiedToClipboard'))
                }).catch(() => {
                    ctx.toaster.error(new UnexpectedError(i18n.global.t('common.notification.failedToCopyToClipboard')))
                })
            }
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
            (ctx: TrafficRecordMetadataItemContext): void => {
                navigator.clipboard.writeText(`${created.toString()}`).then(() => {
                    ctx.toaster.info(i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.created.notification.copiedToClipboard'))
                }).catch(() => {
                    ctx.toaster.error(new UnexpectedError(i18n.global.t('common.notification.failedToCopyToClipboard')))
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
                durationIndicator = MetadataItemSeverity.Failure
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
            duration.toHuman({ smallestUnit: 'milliseconds', biggestUnit: 'milliseconds' }),
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
            ),
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
            ),
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
                i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.finishedStatus.tooltip.error', { error: finishedWithError }),
                i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.finishedStatus.status.error'),
                MetadataItemSeverity.Failure
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
    Failure = 'failure',
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
