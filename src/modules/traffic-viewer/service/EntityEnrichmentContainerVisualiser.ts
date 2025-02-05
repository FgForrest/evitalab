import { TrafficRecordVisualiser } from '@/modules/traffic-viewer/service/TrafficRecordVisualiser'
import { EntityEnrichmentContainer } from '@/modules/connection/model/traffic/EntityEnrichmentContainer'
import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'
import { TrafficRecordVisualisationContext } from '../model/TrafficRecordVisualisationContext'
import {
    Action,
    MetadataGroup,
    MetadataItem,
    TrafficRecordVisualisationDefinition
} from '../model/TrafficRecordVisualisationDefinition'
import { i18n } from '@/vue-plugins/i18n'
import Immutable from 'immutable'
import { EvitaQLConsoleTabData } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabData'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { EvitaQLConsoleTabFactory } from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'

/**
 * Visualises entity enrichment container.
 */
export class EntityEnrichmentContainerVisualiser extends TrafficRecordVisualiser<EntityEnrichmentContainer> {

    private readonly workspaceService: WorkspaceService
    private readonly evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory

    constructor(workspaceService: WorkspaceService, evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory) {
        super()
        this.workspaceService = workspaceService
        this.evitaQLConsoleTabFactory = evitaQLConsoleTabFactory
    }

    canVisualise(trafficRecord: TrafficRecord): boolean {
        return trafficRecord instanceof EntityEnrichmentContainer
    }

    visualise(ctx: TrafficRecordVisualisationContext, trafficRecord: EntityEnrichmentContainer): void {
        const visualisedSessionRecord: TrafficRecordVisualisationDefinition | undefined = ctx.getVisualisedSessionRecord(trafficRecord.sessionId)

        const visualisedRecord: TrafficRecordVisualisationDefinition = new TrafficRecordVisualisationDefinition(
            trafficRecord,
            i18n.global.t('trafficViewer.recordHistory.record.type.enrichment.title', { primaryKey: trafficRecord.primaryKey }),
            undefined,
            this.constructMetadata(trafficRecord, visualisedSessionRecord),
            this.constructActions(ctx, trafficRecord)
        )

        if (visualisedSessionRecord != undefined) {
            visualisedSessionRecord.addChild(visualisedRecord)
            return
        }
        ctx.addRootVisualisedRecord(visualisedRecord)
    }

    private constructMetadata(trafficRecord: EntityEnrichmentContainer,
                              visualisedSessionRecord: TrafficRecordVisualisationDefinition | undefined): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        if (visualisedSessionRecord == undefined) {
            defaultMetadata.push(MetadataItem.sessionId(trafficRecord.sessionId))
        }
        defaultMetadata.push(MetadataItem.created(trafficRecord.created))
        defaultMetadata.push(MetadataItem.finishedStatus(trafficRecord.finishedWithError))
        defaultMetadata.push(MetadataItem.duration(trafficRecord.duration, [10, 20]))
        defaultMetadata.push(MetadataItem.ioFetchedSizeBytes(trafficRecord.ioFetchedSizeBytes))
        defaultMetadata.push(MetadataItem.ioFetchCount(trafficRecord.ioFetchCount))

        return [MetadataGroup.default(defaultMetadata)]
    }

    private constructActions(ctx: TrafficRecordVisualisationContext,
                             trafficRecord: EntityEnrichmentContainer): Immutable.List<Action> {
        const actions: Action[] = []

        actions.push(new Action(
            i18n.global.t('trafficViewer.recordHistory.record.type.enrichment.action.query'),
            'mdi-play',
            () => this.workspaceService.createTab(
                this.evitaQLConsoleTabFactory.createNew(
                    ctx.dataPointer.connection,
                    ctx.dataPointer.catalogName,
                    new EvitaQLConsoleTabData(trafficRecord.query)
                )
            )
        ))

        return Immutable.List(actions)
    }
}
