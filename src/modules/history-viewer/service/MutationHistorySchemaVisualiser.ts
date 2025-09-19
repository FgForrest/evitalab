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
    MetadataItem,
    MutationHistoryItemVisualisationDefinition
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'
import { CaptureArea } from '@/modules/database-driver/request-response/cdc/CaptureArea.ts'

/**
 * Visualises entity enrichment container.
 */
export class MutationHistorySchemaVisualiser extends MutationVisualiser<ChangeCatalogCapture> {

    private readonly workspaceService: WorkspaceService
    private readonly evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory

    constructor(workspaceService: WorkspaceService, evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory) {
        super()
        this.workspaceService = workspaceService
        this.evitaQLConsoleTabFactory = evitaQLConsoleTabFactory
    }

    canVisualise(trafficRecord: ChangeCatalogCapture): boolean {
        return trafficRecord.area == CaptureArea.Schema // todo pfi: better condition
    }

    visualise(ctx: MutationHistoryVisualisationContext, mutationHistory: ChangeCatalogCapture): void {
        const visualisedSessionRecord: MutationHistoryItemVisualisationDefinition | undefined = ctx.getVisualisedSessionRecord(mutationHistory.version)

        const visualisedRecord: MutationHistoryItemVisualisationDefinition = new MutationHistoryItemVisualisationDefinition(
            mutationHistory,
            i18n.global.t('mutationHistoryViewer.record.type.schema.title', { entityType: mutationHistory.entityType }),
            undefined,
            this.constructMetadata(mutationHistory, visualisedSessionRecord),
            this.constructActions(ctx, mutationHistory)
        )

        if (visualisedSessionRecord != undefined) {
            visualisedSessionRecord.addChild(visualisedRecord)
            return
        }
        ctx.addRootVisualisedRecord(visualisedRecord)
    }

    private constructMetadata(trafficRecord: ChangeCatalogCapture,
                              visualisedSessionRecord: MutationHistoryItemVisualisationDefinition | undefined): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        defaultMetadata.push(MetadataItem.sessionId(trafficRecord.area))
        defaultMetadata.push(MetadataItem.sessionId(trafficRecord.operation))
        defaultMetadata.push(MetadataItem.sessionId(trafficRecord.entityType))
        defaultMetadata.push(MetadataItem.sessionId(trafficRecord.entityPrimaryKey))
        defaultMetadata.push(MetadataItem.sessionId(trafficRecord.version))
        defaultMetadata.push(MetadataItem.sessionId(trafficRecord.index))


        return [MetadataGroup.default(defaultMetadata)]
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
