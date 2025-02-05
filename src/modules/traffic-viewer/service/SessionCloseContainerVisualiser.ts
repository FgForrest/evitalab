import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'
import { TrafficRecordVisualiser } from '@/modules/traffic-viewer/service/TrafficRecordVisualiser'
import { TrafficRecordVisualisationContext } from '../model/TrafficRecordVisualisationContext'
import {
    MetadataGroup,
    MetadataItem,
    metadataItemFinishedStatusIdentifier,
    TrafficRecordVisualisationDefinition
} from '../model/TrafficRecordVisualisationDefinition'
import { SessionCloseContainer } from '@/modules/connection/model/traffic/SessionCloseContainer'
import { i18n } from '@/vue-plugins/i18n'
import { formatCount } from '@/utils/string'
import { TrafficRecordPreparationContext } from '@/modules/traffic-viewer/model/TrafficRecordPreparationContext'

/**
 * Session close container isn't visualised but controls the flow of rendered UI.
 * The statistics are rendered using the `SessionStartContainerVisualiser`
 */
export class SessionCloseContainerVisualiser extends TrafficRecordVisualiser<SessionCloseContainer> {

    canVisualise(trafficRecord: TrafficRecord): boolean {
        return trafficRecord instanceof SessionCloseContainer
    }

    prepare(ctx: TrafficRecordPreparationContext, trafficRecord: SessionCloseContainer): void {
        ctx.requestAdditionalSessionStartRecord(trafficRecord.sessionId, trafficRecord)
    }

    visualise(ctx: TrafficRecordVisualisationContext, trafficRecord: SessionCloseContainer): void {
        const visualisedSessionRecord: TrafficRecordVisualisationDefinition | undefined = ctx.getVisualisedSessionRecord(trafficRecord.sessionId)
        if (visualisedSessionRecord == undefined) {
            console.warn(`No 'SessionStartContainer' fount for session ID '${trafficRecord.sessionId.toString()}'. Skipping 'SessionCloseContainer'...`)
            return
        }

        const defaultMetadata: MetadataGroup = visualisedSessionRecord.defaultMetadata!
        const originalFinishedStatus: MetadataItem | undefined = defaultMetadata.items.find(item => item.identifier === metadataItemFinishedStatusIdentifier)
        const newMergedDefaultMetadata: MetadataItem[] = defaultMetadata.items.filter(item =>
            item.identifier !== metadataItemFinishedStatusIdentifier &&
            item.identifier !== 'noStatistics')
        newMergedDefaultMetadata.push(...this.constructMetadata(trafficRecord, originalFinishedStatus))

        defaultMetadata.items = newMergedDefaultMetadata
    }

    private constructMetadata(trafficRecord: SessionCloseContainer,
                              originalFinishedStatus: MetadataItem | undefined): MetadataItem[] {
        const defaultMetadata: MetadataItem[] = []

        const finishedWithError: string = [originalFinishedStatus, trafficRecord.finishedWithError]
            .filter(status => status != undefined)
            .join('; ')

        defaultMetadata.push(MetadataItem.finishedStatus(finishedWithError.length > 0 ? finishedWithError : undefined))
        defaultMetadata.push(MetadataItem.duration(trafficRecord.duration, [5000, 60000]))
        defaultMetadata.push(MetadataItem.ioFetchedSizeBytes(trafficRecord.ioFetchedSizeBytes))
        defaultMetadata.push(MetadataItem.ioFetchCount(trafficRecord.ioFetchCount))
        defaultMetadata.push(new MetadataItem(
            undefined,
            'mdi-update',
            i18n.global.t('trafficViewer.recordHistory.record.type.sessionClose.metadata.item.catalogVersion'),
            String(trafficRecord.catalogVersion)
        ))
        defaultMetadata.push(new MetadataItem(
            undefined,
            'mdi-counter',
            i18n.global.t('trafficViewer.recordHistory.record.type.sessionClose.metadata.item.trafficRecordCount.tooltip'),
            i18n.global.t(
                'trafficViewer.recordHistory.record.type.sessionClose.metadata.item.trafficRecordCount.value',
                // @ts-ignore
                trafficRecord.trafficRecordCount,
                { named: { count: formatCount(trafficRecord.trafficRecordCount) } }
            ),
        ))
        defaultMetadata.push(new MetadataItem(
            undefined,
            'mdi-counter',
            i18n.global.t('trafficViewer.recordHistory.record.type.sessionClose.metadata.item.queryCount.tooltip'),
            i18n.global.t(
                'trafficViewer.recordHistory.record.type.sessionClose.metadata.item.queryCount.value',
                // @ts-ignore
                trafficRecord.queryCount,
                { named: { count: formatCount(trafficRecord.queryCount) } }
            ),
        ))
        defaultMetadata.push(new MetadataItem(
            undefined,
            'mdi-counter',
            i18n.global.t('trafficViewer.recordHistory.record.type.sessionClose.metadata.item.entityFetchCount.tooltip'),
            i18n.global.t(
                'trafficViewer.recordHistory.record.type.sessionClose.metadata.item.entityFetchCount.value',
                // @ts-ignore
                trafficRecord.entityFetchCount,
                { named: { count: formatCount(trafficRecord.entityFetchCount) } }
            ),
        ))
        defaultMetadata.push(new MetadataItem(
            undefined,
            'mdi-counter',
            i18n.global.t('trafficViewer.recordHistory.record.type.sessionClose.metadata.item.mutationCount.tooltip'),
            i18n.global.t(
                'trafficViewer.recordHistory.record.type.sessionClose.metadata.item.mutationCount.value',
                // @ts-ignore
                trafficRecord.mutationCount,
                { named: { count: formatCount(trafficRecord.mutationCount) } }
            ),
        ))

        return defaultMetadata
    }
}
