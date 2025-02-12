import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'
import { TrafficRecordVisualiser } from '@/modules/traffic-viewer/service/TrafficRecordVisualiser'
import { TrafficRecordVisualisationContext } from '../model/TrafficRecordVisualisationContext'
import {
    MetadataGroup,
    MetadataItem,
    metadataItemFinishedStatusIdentifier,
    TrafficRecordVisualisationDefinition
} from '../model/TrafficRecordVisualisationDefinition'
import { SourceQueryStatisticsContainer } from '@/modules/connection/model/traffic/SourceQueryStatisticsContainer'
import { i18n } from '@/vue-plugins/i18n'
import { formatCount } from '@/utils/string'
import { SourceQueryContainer } from '@/modules/connection/model/traffic/SourceQueryContainer'

/**
 * Source query statistics container isn't visualised but controls the flow of rendered UI.
 * The statistics are rendered using the `SourceQueryContainerVisualiser`
 */
export class SourceQueryStatisticsContainerVisualiser extends TrafficRecordVisualiser<SourceQueryStatisticsContainer> {

    canVisualise(trafficRecord: TrafficRecord): boolean {
        return trafficRecord instanceof SourceQueryStatisticsContainer
    }

    visualise(ctx: TrafficRecordVisualisationContext, trafficRecord: SourceQueryStatisticsContainer): void {
        const visualisedSourceQueryRecord: TrafficRecordVisualisationDefinition | undefined = ctx.getVisualisedSourceQueryRecord(trafficRecord.sourceQueryId.toString())
        if (visualisedSourceQueryRecord == undefined) {
            console.warn(`No 'SourceQueryContainer' fount for source query ID '${trafficRecord.sourceQueryId.toString()}'. Skipping 'SourceQueryStatisticsContainer'...`)
            return
        }

        const defaultMetadata: MetadataGroup = visualisedSourceQueryRecord.defaultMetadata!
        const newMergedDefaultMetadata: MetadataItem[] = defaultMetadata.items.filter(item =>
            item.identifier !== metadataItemFinishedStatusIdentifier &&
            item.identifier !== 'noStatistics')
        newMergedDefaultMetadata.push(...this.constructMetadata(trafficRecord, visualisedSourceQueryRecord.source as SourceQueryContainer))

        defaultMetadata.items = newMergedDefaultMetadata
    }

    private constructMetadata(trafficRecord: SourceQueryStatisticsContainer,
                              sourceQueryRecord: SourceQueryContainer): MetadataItem[] {
        const defaultMetadata: MetadataItem[] = []

        const finishedWithError: string = [sourceQueryRecord.finishedWithError, trafficRecord.finishedWithError]
            .filter(status => status != undefined)
            .join('; ')

        defaultMetadata.push(MetadataItem.finishedStatus(finishedWithError.length > 0 ? finishedWithError : undefined))
        defaultMetadata.push(MetadataItem.duration(trafficRecord.duration, [30, 60]))
        defaultMetadata.push(MetadataItem.ioFetchedSizeBytes(trafficRecord.ioFetchedSizeBytes))
        defaultMetadata.push(MetadataItem.ioFetchCount(trafficRecord.ioFetchCount))

        defaultMetadata.push(new MetadataItem(
            undefined, // don't need to reference it
            'mdi-counter',
            i18n.global.t('trafficViewer.recordHistory.record.type.sourceQueryStatistics.metadata.item.returnedRecordCount.tooltip'),
            i18n.global.t(
                'trafficViewer.recordHistory.record.type.sourceQueryStatistics.metadata.item.returnedRecordCount.value',
                //@ts-ignore
                trafficRecord.returnedRecordCount,
                { named: { count: formatCount(trafficRecord.returnedRecordCount) } }
            )
        ))
        defaultMetadata.push(new MetadataItem(
            undefined, // don't need to reference it
            'mdi-counter',
            i18n.global.t('trafficViewer.recordHistory.record.type.sourceQueryStatistics.metadata.item.totalRecordCount.tooltip'),
            i18n.global.t(
                'trafficViewer.recordHistory.record.type.sourceQueryStatistics.metadata.item.totalRecordCount.value',
                //@ts-ignore
                trafficRecord.totalRecordCount,
                { named: { count: formatCount(trafficRecord.totalRecordCount) } }
            )
        ))

        return defaultMetadata
    }

}
