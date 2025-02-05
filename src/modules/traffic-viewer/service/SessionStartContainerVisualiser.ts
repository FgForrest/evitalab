import { TrafficRecordVisualiser } from '@/modules/traffic-viewer/service/TrafficRecordVisualiser'
import { SessionStartContainer } from '@/modules/connection/model/traffic/SessionStartContainer'
import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'
import { TrafficRecordVisualisationContext } from '../model/TrafficRecordVisualisationContext'
import {
    Action,
    MetadataGroup,
    MetadataItem,
    MetadataItemSeverity,
    TrafficRecordVisualisationDefinition
} from '../model/TrafficRecordVisualisationDefinition'
import { i18n } from '@/vue-plugins/i18n'
import Immutable from 'immutable'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import {
    TrafficRecordHistoryViewerTabFactory
} from '@/modules/traffic-viewer/service/TrafficRecordHistoryViewerTabFactory'
import { TrafficRecordHistoryViewerTabData } from '@/modules/traffic-viewer/model/TrafficRecordHistoryViewerTabData'
import { TrafficRecordPreparationContext } from '@/modules/traffic-viewer/model/TrafficRecordPreparationContext'

/**
 * Visualises start of session/transaction. It uses `SessionCloseContainer` record for more statistics.
 */
export class SessionStartContainerVisualiser extends TrafficRecordVisualiser<SessionStartContainer> {

    private readonly workspaceService: WorkspaceService
    private readonly trafficRecordHistoryViewerTabFactory: TrafficRecordHistoryViewerTabFactory

    constructor(workspaceService: WorkspaceService,
                trafficRecordHistoryViewerTabFactory: TrafficRecordHistoryViewerTabFactory) {
        super()
        this.workspaceService = workspaceService
        this.trafficRecordHistoryViewerTabFactory = trafficRecordHistoryViewerTabFactory
    }

    canVisualise(trafficRecord: TrafficRecord): boolean {
        return trafficRecord instanceof SessionStartContainer
    }

    prepare(ctx: TrafficRecordPreparationContext, trafficRecord: SessionStartContainer): void {
        ctx.sessionStartRecordVisited(trafficRecord.sessionId)
    }

    visualise(ctx: TrafficRecordVisualisationContext, trafficRecord: SessionStartContainer): void {
        const visualisedRecord: TrafficRecordVisualisationDefinition = new TrafficRecordVisualisationDefinition(
            trafficRecord,
            i18n.global.t('trafficViewer.recordHistory.record.type.sessionStart.title'),
            trafficRecord.sessionId.toString(),
            this.constructMetadata(trafficRecord),
            this.constructActions(ctx, trafficRecord)
        )
        ctx.addVisualisedSessionRecord(trafficRecord.sessionId, visualisedRecord)
        ctx.addRootVisualisedRecord(visualisedRecord)
    }

    private constructMetadata(trafficRecord: SessionStartContainer): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        defaultMetadata.push(MetadataItem.created(trafficRecord.created))
        defaultMetadata.push(new MetadataItem(
            'noStatistics',
            'mdi-alert-outline',
            i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.noStatistics.tooltip'),
            i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.noStatistics.title'),
            MetadataItemSeverity.Warning
        ))

        return [MetadataGroup.default(defaultMetadata)]
    }

    private constructActions(ctx: TrafficRecordVisualisationContext,
                             trafficRecord: SessionStartContainer): Immutable.List<Action> {
        return Immutable.List([
            new Action(
                i18n.global.t('trafficViewer.recordHistory.record.type.sessionStart.action.open'),
                'mdi-open-in-new',
                () => this.workspaceService.createTab(
                    this.trafficRecordHistoryViewerTabFactory.createNew(
                        ctx.dataPointer.connection,
                        ctx.dataPointer.catalogName,
                        new TrafficRecordHistoryViewerTabData(
                            undefined,
                            undefined,
                            trafficRecord.sessionId,
                            undefined,
                            undefined,
                            undefined
                        )
                    )
                )
            )
        ])
    }
}
