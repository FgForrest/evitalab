import { i18n } from '@/vue-plugins/i18n'
import { List as ImmutableList } from 'immutable'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { getMutationType, getMutationOperationType } from '@/modules/database-driver/request-response/utils/MutationTypeHelper'
import { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import { MutationVisualiser } from '@/modules/history-viewer/service/MutationVisualiser.ts'
import {
    MutationHistoryVisualisationContext
} from '@/modules/history-viewer/model/MutationHistoryVisualisationContext.ts'
import {
    Action,
    MetadataGroup,
    MetadataItem, metadataItemCreatedIdentifier,
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
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'
import { MutationHistoryViewerTabFactory } from '@/modules/history-viewer/service/MutationHistoryViewerTabFactory.ts'
import { MutationHistoryViewerTabData } from '@/modules/history-viewer/model/MutationHistoryViewerTabData.ts'
import { GrpcChangeCaptureContainerType } from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb.ts'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'
import { ContainerType } from '@/modules/database-driver/data-type/ContainerType.ts'
import {
    AssociatedDataMutation
} from '@/modules/database-driver/request-response/data/mutation/associatedData/AssociatedDataMutation.ts'
import {
    UpsertAssociatedDataMutation
} from '@/modules/database-driver/request-response/data/mutation/associatedData/UpsertAssociatedDataMutation.ts'
import {
    SetPriceInnerRecordHandlingMutation
} from '@/modules/database-driver/request-response/data/mutation/price/SetPriceInnerRecordHandlingMutation.ts'
import { OffsetDateTime } from '@/modules/database-driver/data-type/OffsetDateTime.ts'
import type {
    MutationHistoryMetadataItemContext
} from '@/modules/history-viewer/model/MutationHistoryMetadataItemContext.ts'
import type { MutationHistoryCriteria } from '../model/MutationHistoryCriteria'

/**
 * Visualises entity enrichment container.
 */
export class MutationHistoryDataVisualiser extends MutationVisualiser<ChangeCatalogCapture> {

    private readonly workspaceService: WorkspaceService
    private readonly mutationHistoryViewerTabFactory: MutationHistoryViewerTabFactory

    constructor(workspaceService: WorkspaceService, mutationHistoryViewerTabFactory: MutationHistoryViewerTabFactory) {
        super()
        this.workspaceService = workspaceService
        this.mutationHistoryViewerTabFactory = mutationHistoryViewerTabFactory
    }

    canVisualise(changeCatalogCapture: ChangeCatalogCapture): boolean {
        return changeCatalogCapture.area == CaptureArea.Data
    }

    visualise(ctx: MutationHistoryVisualisationContext, mutationHistory: ChangeCatalogCapture): void {
        const visualisedSessionRecord: MutationHistoryItemVisualisationDefinition | undefined = ctx.getVisualisedSessionRecord(mutationHistory.version)
        const entityOperationType = mutationHistory.operation


        // entity
        // const entityActions: Immutable.List<Action> = ctx.historyCriteria.mutableFilters ?
        //     this.constructActions([GrpcChangeCaptureContainerType.CONTAINER_ENTITY], ctx.historyCriteria.entityPrimaryKey ?? mutationHistory.entityPrimaryKey, undefined, ctx, mutationHistory, 'mutationHistoryViewer.record.type.entity.action.open') :
        //     this.constructActions([GrpcChangeCaptureContainerType.CONTAINER_CATALOG], ctx.historyCriteria.entityPrimaryKey ?? mutationHistory.entityPrimaryKey, undefined, ctx, mutationHistory, 'mutationHistoryViewer.record.type.transaction.action.open')

        let visualisedRecord: MutationHistoryItemVisualisationDefinition | undefined
        if (ctx.historyCriteria.containerTypeList?.some(i => i === GrpcChangeCaptureContainerType.CONTAINER_ENTITY) || ctx.historyCriteria.containerTypeList?.length === 0) {
            const entityActions: Immutable.List<Action> = ctx.historyCriteria.mutableFilters ?
                this.constructActions([GrpcChangeCaptureContainerType.CONTAINER_ENTITY], ctx.historyCriteria.entityPrimaryKey ?? mutationHistory.entityPrimaryKey, undefined, ctx, mutationHistory, 'mutationHistoryViewer.record.type.entity.action.open') : ImmutableList()
            visualisedRecord = new MutationHistoryItemVisualisationDefinition(mutationHistory, 'mdi-table', i18n.global.t(`mutationHistoryViewer.record.type.entity.title-${entityOperationType}`, { entityType: mutationHistory.entityType }), `(PK ${mutationHistory.entityPrimaryKey?.toString()})`, undefined, this.constructEntityMetadata(mutationHistory, ctx.historyCriteria), entityActions)
        }

        const mutations = mutationHistory.body instanceof EntityUpsertMutation ?
            (mutationHistory.body as EntityUpsertMutation).localMutations :
            [mutationHistory.body]

        // entity attributes
        for (let attributeMutation of mutations) {
            if (entityOperationType === 'remove') {
                break
            }

            let attributeMutationVisualised: MutationHistoryItemVisualisationDefinition
            if (attributeMutation instanceof ReferenceMutation) {

                const referenceName = attributeMutation?.referenceKey.referenceName
                const attributeValue = attributeMutation?.referenceKey.primaryKey.toString()
                const metadata: MetadataGroup[] = this.constructReferenceMetadata(attributeMutation, ctx.historyCriteria, mutationHistory)

                const actions: Immutable.List<Action> = (!ctx.historyCriteria.mutableFilters && CatalogSchemaConverter.toContainerTypes(ctx.historyCriteria.containerTypeList).contains(ContainerType.Reference)) ?
                    ImmutableList() :
                    this.constructActions([GrpcChangeCaptureContainerType.CONTAINER_REFERENCE], ctx.historyCriteria.entityPrimaryKey ?? mutationHistory.entityPrimaryKey, attributeMutation.referenceKey.referenceName, ctx, mutationHistory, 'mutationHistoryViewer.record.type.reference.action.open')


                const title: string = i18n.global.t('mutationHistoryViewer.record.type.attribute.reference.title', { referenceName: referenceName })
                attributeMutationVisualised = new MutationHistoryItemVisualisationDefinition(mutationHistory, 'mdi-link-variant', title, `(FK ${attributeValue})`, undefined, metadata, actions)

            } else if (attributeMutation instanceof PriceMutation) {
                const attributeValue = attributeMutation instanceof UpsertPriceMutation ? i18n.global.t('mutationHistoryViewer.record.type.attribute.price.detail', {
                    priceListId: attributeMutation.priceKey.priceId,
                    priceListName: attributeMutation.priceKey.priceList,
                    currency: attributeMutation.priceKey.currency,
                    priceWithoutTax: attributeMutation.priceWithoutTax,
                    priceWithTax: attributeMutation.priceWithTax,
                    taxRate: attributeMutation.taxRate
                }) : ''
                const actions: Immutable.List<Action> = (!ctx.historyCriteria.mutableFilters && CatalogSchemaConverter.toContainerTypes(ctx.historyCriteria.containerTypeList).contains(ContainerType.Price)) ?
                    ImmutableList() :
                    this.constructActions([GrpcChangeCaptureContainerType.CONTAINER_PRICE], ctx.historyCriteria.entityPrimaryKey ?? mutationHistory.entityPrimaryKey, undefined, ctx, mutationHistory, 'mutationHistoryViewer.record.type.attribute.action.open')
                const metadata: MetadataGroup[] = this.constructAttributePriceMetadata(attributeMutation, ctx.historyCriteria, mutationHistory)
                const title: string = i18n.global.t('mutationHistoryViewer.record.type.attribute.price.title')
                attributeMutationVisualised = new MutationHistoryItemVisualisationDefinition(mutationHistory, 'mdi-currency-usd', title, attributeValue, undefined, metadata, actions)
            } else if (attributeMutation instanceof AssociatedDataMutation) {
                const type = getMutationOperationType(attributeMutation)
                const title = i18n.global.t(`mutationHistoryViewer.record.type.attribute.associatedData.title-${type}`, { key: attributeMutation.associatedDataKey.associatedDataName })
                const attributeValue = attributeMutation instanceof UpsertAssociatedDataMutation ? JSON.stringify(attributeMutation?.value) : ''
                const attributeTooltip = attributeMutation instanceof UpsertAssociatedDataMutation && typeof  attributeMutation.value === 'object' ? JSON.stringify(attributeMutation?.value, null, 2) : undefined

                const actions: Immutable.List<Action> = (!ctx.historyCriteria.mutableFilters && CatalogSchemaConverter.toContainerTypes(ctx.historyCriteria.containerTypeList).contains(ContainerType.AssociatedData)) ?
                    ImmutableList() :
                    this.constructActions([GrpcChangeCaptureContainerType.CONTAINER_ASSOCIATED_DATA], ctx.historyCriteria.entityPrimaryKey ?? mutationHistory.entityPrimaryKey, undefined, ctx, mutationHistory, 'mutationHistoryViewer.record.type.associatedData.action.open')

                const metadata: MetadataGroup[] = this.constructAttributeMetadata(attributeMutation, ctx.historyCriteria, mutationHistory)
                attributeMutationVisualised = new MutationHistoryItemVisualisationDefinition(mutationHistory, 'mdi-relation-one-to-one-or-many', title, attributeValue, attributeTooltip, metadata, actions)
            } else if (attributeMutation instanceof SetPriceInnerRecordHandlingMutation) {
                const attributeValue = (attributeMutation as SetPriceInnerRecordHandlingMutation).priceInnerRecordHandling.toString()

                const actions = this.getAttributeAction(ctx, mutationHistory, undefined)
                const metadata: MetadataGroup[] = this.constructAttributeMetadata(attributeMutation as LocalMutation, ctx.historyCriteria, mutationHistory)
                const title: string = i18n.global.t(`mutationHistoryViewer.record.type.priceSettings.title`)
                attributeMutationVisualised = new MutationHistoryItemVisualisationDefinition(mutationHistory, 'mdi-database-outline', title, attributeValue, undefined, metadata, actions)
            } else {
                const attributeName = (attributeMutation as AttributeMutation)?.attributeKey?.attributeName
                const attributeValue = attributeMutation instanceof SetPriceInnerRecordHandlingMutation ? (attributeMutation as SetPriceInnerRecordHandlingMutation).priceInnerRecordHandling.toString() : (attributeMutation as UpsertAttributeMutation)?.value?.toString()

                const operationType = mutationHistory.operation
                const actions = this.getAttributeAction(ctx, mutationHistory, attributeName)

                const metadata: MetadataGroup[] = this.constructAttributeMetadata(attributeMutation as LocalMutation, ctx.historyCriteria, mutationHistory)
                const title: string = i18n.global.t(`mutationHistoryViewer.record.type.attribute.title-${operationType}`, { attributeName: attributeName })
                attributeMutationVisualised = new MutationHistoryItemVisualisationDefinition(mutationHistory, 'mdi-database-outline', title, attributeValue, undefined, metadata, actions)
            }
            if (visualisedRecord != undefined) {
                visualisedRecord.addChild(attributeMutationVisualised)
            } else if (visualisedSessionRecord != undefined) {
                visualisedSessionRecord.addChild(attributeMutationVisualised)
            } else {
                ctx.addRootVisualisedRecord(attributeMutationVisualised)
            }

        }


        if (visualisedRecord != undefined) {
            if (visualisedSessionRecord != undefined) {
                visualisedSessionRecord.addChild(visualisedRecord)
                return
            }

            if (ctx.historyCriteria.mutableFilters) {
                // If transaction not yet visualised, queue as pending child to be attached once transaction arrives
                ctx.addPendingChild(mutationHistory.version, visualisedRecord)
            } else {
                ctx.addRootVisualisedRecord(visualisedRecord)
            }
        }

    }

    // todo: fix this ugly condition
    private getAttributeAction(ctx: MutationHistoryVisualisationContext, mutationHistory: ChangeCatalogCapture, attributeName: string | undefined): Immutable.List<Action> {
        if (mutationHistory.entityPrimaryKey === undefined) {
            return ImmutableList()
        } else if (ctx.historyCriteria.mutableFilters) {
            return this.constructActions([GrpcChangeCaptureContainerType.CONTAINER_ATTRIBUTE], ctx.historyCriteria.entityPrimaryKey ?? mutationHistory.entityPrimaryKey, attributeName, ctx, mutationHistory, 'mutationHistoryViewer.record.type.attribute.action.open')
        } else if (!ctx.historyCriteria.mutableFilters && (CatalogSchemaConverter.toContainerTypes(ctx.historyCriteria.containerTypeList).contains(ContainerType.Attribute) ||
            CatalogSchemaConverter.toContainerTypes(ctx.historyCriteria.containerTypeList).contains(ContainerType.Price) ||
            CatalogSchemaConverter.toContainerTypes(ctx.historyCriteria.containerTypeList).contains(ContainerType.Reference) ||
            CatalogSchemaConverter.toContainerTypes(ctx.historyCriteria.containerTypeList).contains(ContainerType.AssociatedData)
        )) {
            return ImmutableList()
        } else {
            return this.constructActions([GrpcChangeCaptureContainerType.CONTAINER_ATTRIBUTE], ctx.historyCriteria.entityPrimaryKey ?? mutationHistory.entityPrimaryKey, attributeName, ctx, mutationHistory, 'mutationHistoryViewer.record.type.attribute.action.open')
        }
    }

    private constructEntityMetadata(mutationHistory: ChangeCatalogCapture, historyCriteria: MutationHistoryCriteria): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        const entityTypes = CatalogSchemaConverter.toContainerTypes(historyCriteria.containerTypeList)

        if (!historyCriteria.mutableFilters && mutationHistory.commitTimestamp && historyCriteria.containerTypeList && [ContainerType.Entity].some(type => entityTypes?.includes(type))) {
            defaultMetadata.push(MutationHistoryDataVisualiser.timestamp(mutationHistory.commitTimestamp))
        }


        defaultMetadata.push(MetadataItem.area(mutationHistory.area))
        defaultMetadata.push(MetadataItem.operation(mutationHistory.operation))
        defaultMetadata.push(MetadataItem.entityType(mutationHistory.entityType))
        defaultMetadata.push(MetadataItem.entityPrimaryKey(mutationHistory.entityPrimaryKey))
        defaultMetadata.push(MetadataItem.version(mutationHistory.version))
        defaultMetadata.push(MetadataItem.index(mutationHistory.index))

        return [MetadataGroup.default(defaultMetadata)]
    }

    private constructAttributeMetadata(localMutation: LocalMutation, historyCriteria: MutationHistoryCriteria, mutationHistory: ChangeCatalogCapture): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        const entityTypes = CatalogSchemaConverter.toContainerTypes(historyCriteria.containerTypeList)

        if (!historyCriteria.mutableFilters && mutationHistory.commitTimestamp && historyCriteria.containerTypeList && [ContainerType.Price, ContainerType.Reference, ContainerType.AssociatedData, ContainerType.Attribute].some(type => entityTypes?.includes(type))) {
            defaultMetadata.push(MutationHistoryDataVisualiser.timestamp(mutationHistory.commitTimestamp))
        }

        defaultMetadata.push(MutationHistoryDataVisualiser.mutationType(getMutationType(localMutation)))

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

    private constructAttributePriceMetadata(localMutation: PriceMutation, historyCriteria: MutationHistoryCriteria, mutationHistory: ChangeCatalogCapture): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        const entityTypes = CatalogSchemaConverter.toContainerTypes(historyCriteria.containerTypeList)

        if (!historyCriteria.mutableFilters && mutationHistory.commitTimestamp && historyCriteria.containerTypeList && [ContainerType.Price, ContainerType.Reference, ContainerType.AssociatedData, ContainerType.Attribute].some(type => entityTypes?.includes(type))) {
            defaultMetadata.push(MutationHistoryDataVisualiser.timestamp(mutationHistory.commitTimestamp))
        }


        defaultMetadata.push(MutationHistoryDataVisualiser.mutationType(getMutationType(localMutation)))


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


    static locale(locale: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-translate',
            i18n.global.t('mutationHistoryViewer.record.type.attribute.locale.tooltip'),
            locale?.toString(),
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
            this.referenceCardinalityIcon(referenceCardinality),
            i18n.global.t('mutationHistoryViewer.record.type.attribute.referenceCardinality.tooltip'),
            referenceCardinality?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

    static referenceCardinalityIcon(referenceCardinality: Cardinality): string {
        switch (referenceCardinality) {
            case Cardinality.ExactlyOne:
                return 'mdi-relation-one-to-one'
            case Cardinality.OneOrMore:
            case Cardinality.OneOrMoreWithDuplicates:
                return 'mdi-relation-one-to-one-or-many'
            case Cardinality.ZeroOrOne:
                return 'mdi-relation-one-to-zero-or-one'
            case Cardinality.ZeroOrMore:
            case Cardinality.ZeroOrMoreWithDuplicates:
                return 'mdi-relation-one-to-zero-or-many'
            default:
                return 'mdi-relation-one-to-one'
        }
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

    static timestamp(created: OffsetDateTime): MetadataItem {
        return new MetadataItem(
            metadataItemCreatedIdentifier,
            'mdi-clock-outline',
            i18n.global.t('mutationHistoryViewer.record.timestamp.title'),
            created.getPrettyPrintableString(),
            MetadataItemSeverity.Info,
            undefined,
            (ctx: MutationHistoryMetadataItemContext): void => {
                navigator.clipboard.writeText(`${created.toString()}`).then(() => {
                    ctx.toaster.info(i18n.global.t('mutationHistoryViewer.record.timestamp.notification.copiedToClipboard'))
                        .then()
                }).catch(() => {
                    ctx.toaster.error(i18n.global.t('common.notification.failedToCopyToClipboard'))
                        .then()
                })
            }
        )
    }



    private constructReferenceMetadata(referenceMutation: ReferenceMutation, historyCriteria: MutationHistoryCriteria, mutationHistory: ChangeCatalogCapture): MetadataGroup[] {
        const defaultMetadata: MetadataItem[] = []

        const entityTypes = CatalogSchemaConverter.toContainerTypes(historyCriteria.containerTypeList)

        if (!historyCriteria.mutableFilters && mutationHistory.commitTimestamp && historyCriteria.containerTypeList && [ContainerType.Price, ContainerType.Reference, ContainerType.AssociatedData, ContainerType.Attribute].some(type => entityTypes?.includes(type))) {
            defaultMetadata.push(MutationHistoryDataVisualiser.timestamp(mutationHistory.commitTimestamp))
        }

        defaultMetadata.push(MutationHistoryDataVisualiser.mutationType(getMutationType(referenceMutation)))
        const referenceName = referenceMutation?.referenceKey.referenceName
        const attributeValue = referenceMutation?.referenceKey.primaryKey.toString()
        defaultMetadata.push(MutationHistoryDataVisualiser.relation(referenceName, attributeValue))
        if (referenceMutation instanceof InsertReferenceMutation) {
            defaultMetadata.push(MutationHistoryDataVisualiser.referenceCardinality(referenceMutation.referenceCardinality))
            defaultMetadata.push(MutationHistoryDataVisualiser.referenceEntityType(referenceMutation.referenceEntityType))
        }

        return [MetadataGroup.default(defaultMetadata)]
    }


    private constructActions(containerType: GrpcChangeCaptureContainerType[], entityPrimaryKey: any, containerName: string | undefined, ctx: MutationHistoryVisualisationContext, cdc: ChangeCatalogCapture, buttonTitle: string): Immutable.List<Action> {
        return ImmutableList([
            new Action(
                i18n.global.t(buttonTitle),
                'mdi-open-in-new',
                'icon',
                () => this.workspaceService.createTab(
                    this.mutationHistoryViewerTabFactory.createNew(
                        ctx.catalogName,
                        new MutationHistoryViewerTabData(
                            undefined,
                            undefined,
                            entityPrimaryKey,
                            undefined,
                            containerName ? [containerName] : undefined,
                            containerType,
                            cdc.entityType,
                            entityPrimaryKey ? 'dataSite' : 'both',
                            false
                        )
                    )
                )
            )
        ])
    }
}
