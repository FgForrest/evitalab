import { TrafficRecordVisualiser } from '@/modules/traffic-viewer/service/TrafficRecordVisualiser'
import { MutationContainer } from '@/modules/connection/model/traffic/MutationContainer'
import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'
import { TrafficRecordVisualisationContext } from '../model/TrafficRecordVisualisationContext'
import {
    MetadataGroup,
    MetadataItem,
    TrafficRecordVisualisationDefinition
} from '../model/TrafficRecordVisualisationDefinition'
import { i18n } from '@/vue-plugins/i18n'
import Immutable from 'immutable'

/**
 * Visualises mutation record.
 */
export class MutationContainerVisualiser extends TrafficRecordVisualiser<MutationContainer> {

    canVisualise(trafficRecord: TrafficRecord): boolean {
        return trafficRecord instanceof MutationContainer
    }

    visualise(ctx: TrafficRecordVisualisationContext, trafficRecord: MutationContainer): void {
        const visualisedRecord: TrafficRecordVisualisationDefinition = new TrafficRecordVisualisationDefinition(
            trafficRecord,
            i18n.global.t('trafficViewer.recordHistory.record.type.mutation.title'),
            JSON.stringify(trafficRecord.serializedMutation), // todo lho do better
            this.constructMetadata(trafficRecord),
            Immutable.List()
        )

        const visualisedSessionRecord: TrafficRecordVisualisationDefinition | undefined = ctx.getVisualisedSessionRecord(trafficRecord.sessionId)
        if (visualisedSessionRecord != undefined) {
            visualisedSessionRecord.addChild(visualisedRecord)
            return
        }

        ctx.addRootVisualisedRecord(visualisedRecord)
    }

    private constructMetadata(trafficRecord: MutationContainer): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        defaultMetadata.push(MetadataItem.created(trafficRecord.created))
        defaultMetadata.push(MetadataItem.finishedStatus(trafficRecord.finishedWithError))
        defaultMetadata.push(MetadataItem.duration(trafficRecord.duration, [20, 60]))
        defaultMetadata.push(MetadataItem.ioFetchedSizeBytes(trafficRecord.ioFetchedSizeBytes))
        defaultMetadata.push(MetadataItem.ioFetchCount(trafficRecord.ioFetchCount))

        return [MetadataGroup.default(defaultMetadata)]
    }
}
