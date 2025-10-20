import { i18n } from '@/vue-plugins/i18n'
import { List as ImmutableList } from 'immutable'
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
    metadataItemSessionIdIdentifier,
    MetadataItemSeverity,
    MutationHistoryItemVisualisationDefinition
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'
import { CaptureArea } from '@/modules/database-driver/request-response/cdc/CaptureArea.ts'
import type {
    AttributeMutation
} from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeMutation.ts'
import {
    UpsertAttributeMutation
} from '@/modules/database-driver/request-response/data/mutation/attribute/UpsertAttributeMutation.ts'
import { EntityUpsertMutation } from '@/modules/database-driver/request-response/data/mutation/EntityUpsertMutation.ts'
import {
    ReferenceMutation
} from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceMutation.ts'
import type { LocalMutation } from '@/modules/database-driver/request-response/data/mutation/LocalMutation.ts'
import {
    UpsertPriceMutation
} from '@/modules/database-driver/request-response/data/mutation/price/UpsertPriceMutation.ts'
import { PriceMutation } from '@/modules/database-driver/request-response/data/mutation/price/PriceMutation.ts'
import {
    RemovePriceMutation
} from '@/modules/database-driver/request-response/data/mutation/price/RemovePriceMutation.ts'
import type { DateTimeRange } from '@/modules/database-driver/data-type/DateTimeRange.ts'
import {
    InsertReferenceMutation
} from '@/modules/database-driver/request-response/data/mutation/reference/InsertReferenceMutation.ts'
import type { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'
import { MutationHistoryViewerTabFactory } from '@/modules/history-viewer/service/MutationHistoryViewerTabFactory.ts'
import { MutationHistoryViewerTabData } from '@/modules/history-viewer/model/MutationHistoryViewerTabData.ts'
import { GrpcChangeCaptureContainerType } from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'

/**
 * Visualises entity enrichment container.
 */
export class MutationHistoryDataVisualiser extends MutationVisualiser<ChangeCatalogCapture> {

    private readonly workspaceService: WorkspaceService
    private readonly evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory
    private readonly mutationHistoryViewerTabFactory: MutationHistoryViewerTabFactory

    constructor(workspaceService: WorkspaceService, evitaQLConsoleTabFactory: EvitaQLConsoleTabFactory, trafficRecordHistoryViewerTabFactory: MutationHistoryViewerTabFactory) {
        super()
        this.workspaceService = workspaceService
        this.evitaQLConsoleTabFactory = evitaQLConsoleTabFactory
        this.mutationHistoryViewerTabFactory = trafficRecordHistoryViewerTabFactory
    }

    canVisualise(trafficRecord: ChangeCatalogCapture): boolean {
        return trafficRecord.area == CaptureArea.Data
    }

    visualise(ctx: MutationHistoryVisualisationContext, mutationHistory: ChangeCatalogCapture): void {
        const visualisedSessionRecord: MutationHistoryItemVisualisationDefinition | undefined = ctx.getVisualisedSessionRecord(mutationHistory.version)

        // entity
        const visualisedRecord: MutationHistoryItemVisualisationDefinition = new MutationHistoryItemVisualisationDefinition(
            mutationHistory,
            i18n.global.t('mutationHistoryViewer.record.type.entity.title', { entityType: mutationHistory.entityType }),
            `(PK ${mutationHistory.entityPrimaryKey?.toString()})`,
            this.constructEntityMetadata(mutationHistory, visualisedSessionRecord),
            this.constructActions(GrpcChangeCaptureContainerType.CONTAINER_ENTITY, ctx, mutationHistory)
        )

        const mutations = mutationHistory.body instanceof EntityUpsertMutation ?
            (mutationHistory.body as EntityUpsertMutation).localMutations :
            [mutationHistory.body]

        // entity attributes
        for (let attributeMutation of mutations) {

            if (attributeMutation instanceof ReferenceMutation) { // todo pfi: fix this ugly code

                const referenceName = attributeMutation?.referenceKey.referenceName
                const attributeValue = attributeMutation?.referenceKey.primaryKey.toString()
                const attributeMutationVisualised: MutationHistoryItemVisualisationDefinition = new MutationHistoryItemVisualisationDefinition(
                    mutationHistory,
                    i18n.global.t('mutationHistoryViewer.record.type.attribute.reference.title', { referenceName: referenceName }),
                    `(FK ${attributeValue})`,
                    this.constructReferenceMetadata(attributeMutation, visualisedSessionRecord),
                    this.constructActions(GrpcChangeCaptureContainerType.CONTAINER_REFERENCE, ctx, mutationHistory)
                )
                visualisedRecord.addChild(attributeMutationVisualised)

            } else if (attributeMutation instanceof PriceMutation) {
                const attributeName = 'Price'
                const attributeValue = attributeMutation instanceof UpsertPriceMutation ? i18n.global.t('mutationHistoryViewer.record.type.attribute.price.detail', {
                    priceWithoutTax: attributeMutation.priceWithoutTax,
                    priceWithTax: attributeMutation.priceWithTax,
                    taxRate: attributeMutation.taxRate
                }) : ''
                const attributeMutationVisualised: MutationHistoryItemVisualisationDefinition = new MutationHistoryItemVisualisationDefinition(
                    mutationHistory,
                    i18n.global.t('mutationHistoryViewer.record.type.attribute.price.title'),
                    attributeValue,
                    this.constructAttributePriceMetadata(attributeMutation, visualisedSessionRecord),
                    this.constructActions(GrpcChangeCaptureContainerType.CONTAINER_PRICE, ctx, mutationHistory)
                )
                visualisedRecord.addChild(attributeMutationVisualised)
            } else {
                const attributeName = (attributeMutation as AttributeMutation)?.attributeKey?.attributeName
                const attributeValue = (attributeMutation as UpsertAttributeMutation)?.value?.toString()
                const attributeMutationVisualised: MutationHistoryItemVisualisationDefinition = new MutationHistoryItemVisualisationDefinition(
                    mutationHistory,
                    i18n.global.t('mutationHistoryViewer.record.type.attribute.title', { attributeName: attributeName }),
                    attributeValue,
                    this.constructAttributeMetadata(attributeMutation as LocalMutation, visualisedSessionRecord),
                    this.constructActions(GrpcChangeCaptureContainerType.CONTAINER_ATTRIBUTE, ctx, mutationHistory)
                )
                visualisedRecord.addChild(attributeMutationVisualised)
            }
            // todo INSTANCEOF AssociatedDataMutation  GrpcChangeCaptureContainerType.ASSOCIATED_DATA

        }


        if (visualisedSessionRecord != undefined) {
            visualisedSessionRecord.addChild(visualisedRecord)
            return
        }
        // If transaction not yet visualised, queue as pending child to be attached once transaction arrives
        ctx.addPendingChild(mutationHistory.version, visualisedRecord)
    }

    private constructEntityMetadata(mutationHistory: ChangeCatalogCapture,
                                    visualisedSessionRecord: MutationHistoryItemVisualisationDefinition | undefined): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        defaultMetadata.push(MetadataItem.area(mutationHistory.area))
        defaultMetadata.push(MetadataItem.operation(mutationHistory.operation))
        defaultMetadata.push(MetadataItem.entityType(mutationHistory.entityType))
        defaultMetadata.push(MetadataItem.entityPrimaryKey(mutationHistory.entityPrimaryKey))
        defaultMetadata.push(MetadataItem.version(mutationHistory.version))
        defaultMetadata.push(MetadataItem.index(mutationHistory.index))

        return [MetadataGroup.default(defaultMetadata)]
    }

    private constructAttributeMetadata(localMutation: LocalMutation,
                                       visualisedSessionRecord: MutationHistoryItemVisualisationDefinition | undefined): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        defaultMetadata.push(MutationHistoryDataVisualiser.mutationType(localMutation.constructor.name))

        // todo pfi fix
        // console.log(localMutation)

        if (localMutation instanceof UpsertAttributeMutation) {
            if (localMutation?.attributeKey?.locale) {
                defaultMetadata.push(MutationHistoryDataVisualiser.locale(localMutation.attributeKey.locale))
            }
        } else if (localMutation instanceof UpsertPriceMutation) {
            // if (localMutation.) {
            //     defaultMetadata.push(MutationHistoryDataVisualiser.locale(localMutation.attributeKey.locale))
            // }
        }


        return [MetadataGroup.default(defaultMetadata)]
    }

    private constructAttributePriceMetadata(localMutation: PriceMutation,
                                            visualisedSessionRecord: MutationHistoryItemVisualisationDefinition | undefined): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        defaultMetadata.push(MutationHistoryDataVisualiser.mutationType(localMutation.constructor.name))

        // todo pfi fix
        // console.log(localMutation)

        if (localMutation instanceof UpsertPriceMutation) {
            defaultMetadata.push(MutationHistoryDataVisualiser.currency(localMutation.priceKey.currency))
            defaultMetadata.push(MutationHistoryDataVisualiser.priceList(localMutation.priceKey.priceList))
            defaultMetadata.push(MutationHistoryDataVisualiser.priceId(localMutation.priceKey.priceId))

            defaultMetadata.push(MutationHistoryDataVisualiser.indexed(localMutation.indexed))
            defaultMetadata.push(MutationHistoryDataVisualiser.validityFromTo(localMutation.validity))

        } else if (localMutation instanceof RemovePriceMutation) {

        } else {
            console.error(`Not implemented price mutation ${localMutation}`)
        }


        return [MetadataGroup.default(defaultMetadata)]
    }

    static validityFromTo(validity: DateTimeRange | undefined): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-calendar-range-outline',
            i18n.global.t('mutationHistoryViewer.record.type.attribute.validity.tooltip'),
            validity?.getPrettyPrintableString() ?? 'Infinity',
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static indexed(currency: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-flash',
            i18n.global.t('mutationHistoryViewer.record.type.attribute.indexed.tooltip'),
            currency?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static priceId(currency: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-identifier',
            i18n.global.t('mutationHistoryViewer.record.type.attribute.priceId.tooltip'),
            currency?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static priceList(currency: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-currency-usd',
            i18n.global.t('mutationHistoryViewer.record.type.attribute.priceList.tooltip'),
            currency?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static currency(currency: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-cash',
            i18n.global.t('mutationHistoryViewer.record.type.attribute.currency.tooltip'),
            currency?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }


    static locale(sessionId: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('mutationHistoryViewer.record.type.attribute.locale.tooltip'),
            sessionId?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static mutationType(sessionId: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('mutationHistoryViewer.record.type.attribute.mutationType.tooltip'),
            sessionId?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static referenceCardinality(referenceCardinality: Cardinality): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('mutationHistoryViewer.record.type.attribute.referenceCardinality.tooltip'),
            referenceCardinality?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static referenceEntityType(referenceEntityType: string | undefined): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('mutationHistoryViewer.record.type.attribute.referenceEntityType.tooltip'),
            referenceEntityType ? referenceEntityType.toString() : 'Unknown',
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static relation(referenceName: string, referenceId: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('mutationHistoryViewer.record.type.attribute.referenceRelation.tooltip'),
            `${referenceName} : ${referenceId}`,
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }


    private constructReferenceMetadata(referenceMutation: ReferenceMutation,
                                       visualisedSessionRecord: MutationHistoryItemVisualisationDefinition | undefined): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []
        defaultMetadata.push(MutationHistoryDataVisualiser.mutationType(referenceMutation.constructor.name))
        const referenceName = referenceMutation?.referenceKey.referenceName
        const attributeValue = referenceMutation?.referenceKey.primaryKey.toString()
        defaultMetadata.push(MutationHistoryDataVisualiser.relation(referenceName, attributeValue))
        if (referenceMutation instanceof InsertReferenceMutation) {
            defaultMetadata.push(MutationHistoryDataVisualiser.referenceCardinality(referenceMutation.referenceCardinality))
            defaultMetadata.push(MutationHistoryDataVisualiser.referenceEntityType(referenceMutation.referenceEntityType))
        }

        return [MetadataGroup.default(defaultMetadata)]
    }


    private constructActions(containerType: GrpcChangeCaptureContainerType, ctx: MutationHistoryVisualisationContext, cdc: ChangeCatalogCapture): ImmutableList<Action> {
        return ImmutableList([
            new Action(
                i18n.global.t('trafficViewer.recordHistory.record.type.sessionStart.action.open'),
                'mdi-open-in-new',
                () => this.workspaceService.createTab(
                    this.mutationHistoryViewerTabFactory.createNew(
                        ctx.catalogName,
                        new MutationHistoryViewerTabData(
                            undefined,
                            undefined,
                            cdc.entityPrimaryKey,
                            undefined,
                            undefined,
                            [containerType],
                            cdc.entityType,
                            undefined
                        )
                    )
                )
            )
        ])
    }



}
