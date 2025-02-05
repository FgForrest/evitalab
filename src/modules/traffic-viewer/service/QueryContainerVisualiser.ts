import { TrafficRecordVisualiser } from '@/modules/traffic-viewer/service/TrafficRecordVisualiser'
import { QueryContainer } from '@/modules/connection/model/traffic/QueryContainer'
import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'
import { TrafficRecordVisualisationContext } from '../model/TrafficRecordVisualisationContext'
import {
    Action,
    MetadataGroup,
    MetadataItem,
    MetadataItemSeverity,
    TrafficRecordVisualisationDefinition
} from '../model/TrafficRecordVisualisationDefinition'
import { EvitaQLConsoleTabFactory } from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { i18n } from '@/vue-plugins/i18n'
import Immutable from 'immutable'
import { EvitaQLConsoleTabData } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabData'
import { TrafficRecordMetadataItemContext } from '@/modules/traffic-viewer/model/TrafficRecordMetadataItemContext'
import { Label, labelSourceQuery, systemLabels } from '@/modules/connection/model/traffic/Label'
import { formatCount } from '@/utils/string'
import { TrafficRecordPreparationContext } from '@/modules/traffic-viewer/model/TrafficRecordPreparationContext'

/**
 * Visualises query record.
 */
export class QueryContainerVisualiser extends TrafficRecordVisualiser<QueryContainer> {

    private readonly workspaceService: WorkspaceService
    private readonly evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory

    constructor(workspaceService: WorkspaceService, evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory) {
        super()
        this.workspaceService = workspaceService
        this.evitaQLConsoleTabFactory = evitaQLConsoleTabFactory
    }

    canVisualise(trafficRecord: TrafficRecord): boolean {
        return trafficRecord instanceof QueryContainer
    }

    prepare(ctx: TrafficRecordPreparationContext, trafficRecord: QueryContainer): void {
        const sourceQueryId: string | undefined = this.resolveSourceQueryId(trafficRecord)
        if (sourceQueryId != undefined) {
            ctx.requestAdditionalSourceQueryRecord(sourceQueryId, trafficRecord)
        }
    }

    visualise(ctx: TrafficRecordVisualisationContext, trafficRecord: QueryContainer): void {
        const visualisedSessionRecord: TrafficRecordVisualisationDefinition | undefined = ctx.getVisualisedSessionRecord(trafficRecord.sessionId)

        const sourceQueryId: string | undefined = this.resolveSourceQueryId(trafficRecord)
        let visualisedSourceQueryRecord: TrafficRecordVisualisationDefinition | undefined = undefined
        if (sourceQueryId != undefined) {
            visualisedSourceQueryRecord = ctx.getVisualisedSourceQueryRecord(sourceQueryId)
        }

        const visualisedRecord: TrafficRecordVisualisationDefinition = new TrafficRecordVisualisationDefinition(
            trafficRecord,
            i18n.global.t('trafficViewer.recordHistory.record.type.query.title'),
            trafficRecord.queryDescription,
            this.constructMetadata(trafficRecord, visualisedSessionRecord, visualisedSourceQueryRecord),
            this.constructActions(ctx, trafficRecord)
        )

        if (visualisedSourceQueryRecord != undefined) {
            visualisedSourceQueryRecord.addChild(visualisedRecord)
            return
        }
        if (visualisedSessionRecord != undefined) {
            visualisedSessionRecord.addChild(visualisedRecord)
            return
        }
        ctx.addRootVisualisedRecord(visualisedRecord)
    }

    private constructMetadata(trafficRecord: QueryContainer,
                              visualisedSessionRecord: TrafficRecordVisualisationDefinition | undefined,
                              visualisedSourceQueryRecord: TrafficRecordVisualisationDefinition | undefined): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        if (visualisedSessionRecord == undefined && visualisedSourceQueryRecord == undefined) {
            defaultMetadata.push(MetadataItem.sessionId(trafficRecord.sessionId))
        }
        defaultMetadata.push(MetadataItem.created(trafficRecord.created))
        defaultMetadata.push(MetadataItem.finishedStatus(trafficRecord.finishedWithError))
        defaultMetadata.push(MetadataItem.duration(trafficRecord.duration, [30, 60]))
        defaultMetadata.push(MetadataItem.ioFetchedSizeBytes(trafficRecord.ioFetchedSizeBytes))
        defaultMetadata.push(MetadataItem.ioFetchCount(trafficRecord.ioFetchCount))
        defaultMetadata.push(new MetadataItem(
            undefined, // don't need to reference it
            'mdi-counter',
            i18n.global.t('trafficViewer.recordHistory.record.type.query.metadata.item.primaryKeys.tooltip'),
            i18n.global.t(
                'trafficViewer.recordHistory.record.type.query.metadata.item.primaryKeys.value',
                // @ts-ignore
                trafficRecord.primaryKeys.size,
                { named: { count: formatCount(trafficRecord.primaryKeys.size) } }
            )
        ))
        defaultMetadata.push(new MetadataItem(
            undefined, // don't need to reference it
            'mdi-counter',
            i18n.global.t('trafficViewer.recordHistory.record.type.query.metadata.item.totalRecordCount.tooltip'),
            i18n.global.t(
                'trafficViewer.recordHistory.record.type.query.metadata.item.totalRecordCount.value',
                // @ts-ignore
                trafficRecord.totalRecordCount,
                { named: { count: formatCount(trafficRecord.totalRecordCount) } }
            )
        ))

        const queryLabelsMetadata: MetadataItem[] = []

        for (const label of trafficRecord.labels) {
            if (systemLabels.includes(label.name)) {
                continue
            }
            queryLabelsMetadata.push(new MetadataItem(
                undefined, // don't need to reference it
                'mdi-tag-outline',
                i18n.global.t('trafficViewer.recordHistory.record.type.query.metadata.item.queryLabel'),
                label.name,
                MetadataItemSeverity.Info,
                label.value,
                (ctx: TrafficRecordMetadataItemContext) => {
                    const historyCriteriaLabels: Label[] | undefined = ctx.historyCriteria.value.labels
                    const existingLabelUnderName = historyCriteriaLabels.findIndex(it => it.name === label.name)
                    if (existingLabelUnderName > -1) {
                        historyCriteriaLabels.splice(existingLabelUnderName, 1)
                    }
                    historyCriteriaLabels.push(label)
                }
            ))
        }

        return [
            MetadataGroup.default(defaultMetadata),
            new MetadataGroup(
                undefined,
                'mdi-tag-outline',
                i18n.global.t('trafficViewer.recordHistory.record.type.query.metadata.group.queryLabels'),
                i18n.global.t('trafficViewer.recordHistory.record.type.query.metadata.group.queryLabels'),
                queryLabelsMetadata
            )
        ]
    }

    private constructActions(ctx: TrafficRecordVisualisationContext,
                             trafficRecord: QueryContainer): Immutable.List<Action> {
        const actions: Action[] = []

        actions.push(new Action(
            i18n.global.t('trafficViewer.recordHistory.record.type.query.action.query'),
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

    private resolveSourceQueryId(trafficRecord: QueryContainer): string | undefined {
        const sourceQueryId: string | undefined = trafficRecord.labels
            .find(label => label.name === labelSourceQuery)
            ?.value
        if (sourceQueryId != undefined) {
            return sourceQueryId.substring(1, sourceQueryId.length - 1)
        }
        return undefined
    }
}
