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
    MetadataItem, metadataItemIoFetchCountIdentifier,
    metadataItemSessionIdIdentifier,
    MetadataItemSeverity,
    MutationHistoryItemVisualisationDefinition
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'
import { CaptureArea } from '@/modules/database-driver/request-response/cdc/CaptureArea.ts'
import type {
    ModifyEntitySchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/catalog/ModifyEntitySchemaMutation.ts'
import { formatCount } from '@/utils/string.ts'

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

        const visualisedRecord: MutationHistoryItemVisualisationDefinition = new MutationHistoryItemVisualisationDefinition(mutationHistory, 'mdi-table', i18n.global.t('mutationHistoryViewer.record.type.schema.title', { entityType: mutationHistory.entityType }), undefined, this.constructMetadata(mutationHistory, visualisedSessionRecord), ImmutableList())


        // entity attributes
        if ((mutationHistory.body as ModifyEntitySchemaMutation)?.schemaMutations) {
            for (let schemaMutation of (mutationHistory.body as ModifyEntitySchemaMutation)?.schemaMutations) {
                console.log(schemaMutation)

                const attributeName = schemaMutation?.constructor.name
                const attributeMutationVisualised: MutationHistoryItemVisualisationDefinition = new MutationHistoryItemVisualisationDefinition(mutationHistory, 'mdi-database-outline', i18n.global.t('mutationHistoryViewer.record.type.attribute.title', { attributeName: attributeName }), JSON.stringify(schemaMutation), [], ImmutableList())
                visualisedRecord.addChild(attributeMutationVisualised)
            }
        }


        if (visualisedSessionRecord != undefined) {
            visualisedSessionRecord.addChild(visualisedRecord)
            return
        }
        console.error('Hey, some data without transaction')
        ctx.addRootVisualisedRecord(visualisedRecord) // todo pfi: this should never happens - try it with pagination and filters and limits
    }

    private constructMetadata(mutationHistory: ChangeCatalogCapture,
                              visualisedSessionRecord: MutationHistoryItemVisualisationDefinition | undefined): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        defaultMetadata.push(MetadataItem.area(mutationHistory.area))
        defaultMetadata.push(MetadataItem.operation(mutationHistory.operation))
        defaultMetadata.push(MetadataItem.entityType(mutationHistory.entityType))
        defaultMetadata.push(MetadataItem.version(mutationHistory.version))
        defaultMetadata.push(MetadataItem.index(mutationHistory.index))
        defaultMetadata.push(MutationHistorySchemaVisualiser.mutationCount((mutationHistory.body as ModifyEntitySchemaMutation)?.schemaMutations?.size))
        defaultMetadata.push(MutationHistorySchemaVisualiser.mutationType(mutationHistory?.body?.constructor?.name))


        return [MetadataGroup.default(defaultMetadata)]
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


    static mutationType(sessionId: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('mutationHistoryViewer.record.type.attribute.mutationType.tooltip'), // todo fix translation key
            sessionId?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
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
