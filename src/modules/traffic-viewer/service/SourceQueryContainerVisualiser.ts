import { TrafficRecordVisualiser } from '@/modules/traffic-viewer/service/TrafficRecordVisualiser'
import { SourceQueryContainer } from '@/modules/connection/model/traffic/SourceQueryContainer'
import { TrafficRecord } from '@/modules/connection/model/traffic/TrafficRecord'
import Immutable from 'immutable'
import {
    Action,
    MetadataGroup,
    MetadataItem,
    MetadataItemSeverity,
    TrafficRecordVisualisationDefinition
} from '../model/TrafficRecordVisualisationDefinition'
import { i18n } from '@/vue-plugins/i18n'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { GraphQLConsoleTabFactory } from '@/modules/graphql-console/console/workspace/service/GraphQLConsoleTabFactory'
import { TrafficRecordVisualisationContext } from '@/modules/traffic-viewer/model/TrafficRecordVisualisationContext'
import { GraphQLInstanceType } from '@/modules/graphql-console/console/model/GraphQLInstanceType'
import { GraphQLConsoleTabData } from '@/modules/graphql-console/console/workspace/model/GraphQLConsoleTabData'
import { Label, labelSourceType, systemLabels } from '@/modules/connection/model/traffic/Label'
import { TrafficRecordMetadataItemContext } from '@/modules/traffic-viewer/model/TrafficRecordMetadataItemContext'
import { EvitaQLConsoleTabFactory } from '@/modules/evitaql-console/console/workspace/service/EvitaQLConsoleTabFactory'
import { EvitaQLConsoleTabData } from '@/modules/evitaql-console/console/workspace/model/EvitaQLConsoleTabData'
import { TrafficRecordPreparationContext } from '@/modules/traffic-viewer/model/TrafficRecordPreparationContext'

/**
 * Visualises the source query container record. Uses statistics from the `SourceQueryStatisticsContainer`.
 */
export class SourceQueryContainerVisualiser extends TrafficRecordVisualiser<SourceQueryContainer> {

    private readonly workspaceService: WorkspaceService
    private readonly graphQLConsoleTabFactory: GraphQLConsoleTabFactory
    private readonly evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory

    constructor(workspaceService: WorkspaceService,
                graphQLConsoleTabFactory: GraphQLConsoleTabFactory,
                evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory) {
        super()
        this.workspaceService = workspaceService
        this.graphQLConsoleTabFactory = graphQLConsoleTabFactory
        this.evitaQLConsoleTabFactory = evitaQLConsoleTabFactory
    }

    canVisualise(trafficRecord: TrafficRecord): boolean {
        return trafficRecord instanceof SourceQueryContainer
    }

    prepare(ctx: TrafficRecordPreparationContext, trafficRecord: SourceQueryContainer): void {
        ctx.sourceQueryRecordVisited(trafficRecord.sourceQueryId.toString())
    }

    visualise(ctx: TrafficRecordVisualisationContext, trafficRecord: SourceQueryContainer): void {
        const visualisedSessionRecord: TrafficRecordVisualisationDefinition | undefined = ctx.getVisualisedSessionRecord(trafficRecord.sessionId)

        const queryType: QueryType | undefined = this.resolveQueryType(trafficRecord)
        const visualisedRecord: TrafficRecordVisualisationDefinition = new TrafficRecordVisualisationDefinition(
            trafficRecord,
            i18n.global.t(
                'trafficViewer.recordHistory.record.type.sourceQuery.title',
                { queryType: queryType || '?' }
            ),
            undefined,
            this.constructMetadata(trafficRecord, visualisedSessionRecord),
            this.constructActions(ctx, trafficRecord, queryType)
        )
        ctx.addVisualisedSourceQueryRecord(trafficRecord.sourceQueryId.toString(), visualisedRecord)

        if (visualisedSessionRecord != undefined) {
            visualisedSessionRecord.addChild(visualisedRecord)
            return
        }
        ctx.addRootVisualisedRecord(visualisedRecord)
    }

    private resolveQueryType(trafficRecord: SourceQueryContainer): QueryType | undefined {
        const label: Label | undefined = trafficRecord.labels.find(label => label.name === labelSourceType)
        if (label == undefined) {
            return undefined
        }
        return label.value!.substring(1, label.value!.length - 1) as QueryType
    }

    private constructMetadata(trafficRecord: SourceQueryContainer,
                              visualisedSessionRecord: TrafficRecordVisualisationDefinition | undefined): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        if (visualisedSessionRecord == undefined) {
            defaultMetadata.push(MetadataItem.sessionId(trafficRecord.sessionId))
        }
        defaultMetadata.push(MetadataItem.created(trafficRecord.created))
        defaultMetadata.push(new MetadataItem(
            'noStatistics',
            'mdi-alert-outline',
            i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.noStatistics.tooltip'),
            i18n.global.t('trafficViewer.recordHistory.record.type.common.metadata.item.noStatistics.title'),
            MetadataItemSeverity.Warning
        ))

        const queryLabelsMetadata: MetadataItem[] = []

        for (const label of trafficRecord.labels) {
            if (systemLabels.includes(label.name)) {
                continue
            }
            queryLabelsMetadata.push(new MetadataItem(
                undefined, // don't need to reference it
                'mdi-tag-outline',
                i18n.global.t('trafficViewer.recordHistory.record.type.sourceQuery.metadata.item.queryLabel'),
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
                i18n.global.t('trafficViewer.recordHistory.record.type.sourceQuery.metadata.group.queryLabels'),
                i18n.global.t('trafficViewer.recordHistory.record.type.sourceQuery.metadata.group.queryLabels'),
                queryLabelsMetadata
            )
        ]
    }

    private constructActions(ctx: TrafficRecordVisualisationContext,
                             trafficRecord: SourceQueryContainer,
                             queryType: QueryType | undefined): Immutable.List<Action> {
        const actions: Action[] = []

        let queryActionCallback: (() => void) | undefined = undefined
        if (queryType === QueryType.GraphQL) {
            const sourceQuery: { query: string, variables: any, extensions: any } = JSON.parse(trafficRecord.sourceQuery)
            queryActionCallback = () => this.workspaceService.createTab(
                this.graphQLConsoleTabFactory.createNew(
                    ctx.dataPointer.connection,
                    ctx.dataPointer.catalogName,
                    GraphQLInstanceType.Data,
                    new GraphQLConsoleTabData(
                        sourceQuery.query,
                        JSON.stringify(sourceQuery.variables),
                    )
                )
            )
        } else if (queryType === QueryType.Grpc) {
            queryActionCallback = () => this.workspaceService.createTab(
                this.evitaQLConsoleTabFactory.createNew(
                    ctx.dataPointer.connection,
                    ctx.dataPointer.catalogName,
                    new EvitaQLConsoleTabData(trafficRecord.sourceQuery)
                )
            )
        }
        if (queryActionCallback != undefined) {
            actions.push(new Action(
                i18n.global.t('trafficViewer.recordHistory.record.type.sourceQuery.action.query'),
                'mdi-play',
                queryActionCallback
            ))
        }

        return Immutable.List(actions)
    }
}

/**
 * Supported query types that produces source query
 */
enum QueryType {
    GraphQL = 'GraphQL',
    Grpc = 'gRPC',
    REST = 'REST'
}
