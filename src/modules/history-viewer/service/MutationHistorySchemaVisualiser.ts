import { i18n } from '@/vue-plugins/i18n'
import { List as ImmutableList } from 'immutable'
import { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import { MutationVisualiser } from '@/modules/history-viewer/service/MutationVisualiser.ts'
import {
    MutationHistoryVisualisationContext
} from '@/modules/history-viewer/model/MutationHistoryVisualisationContext.ts'
import {
    MetadataGroup,
    MetadataItem,
    metadataItemIoFetchCountIdentifier,
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

    constructor() {
        super()
    }

    canVisualise(changeCatalogCapture: ChangeCatalogCapture): boolean {
        return changeCatalogCapture.area == CaptureArea.Schema
    }

    visualise(ctx: MutationHistoryVisualisationContext, mutationHistory: ChangeCatalogCapture): void {
        const visualisedSessionRecord: MutationHistoryItemVisualisationDefinition | undefined = ctx.getVisualisedSessionRecord(mutationHistory.version)

        const visualisedRecord: MutationHistoryItemVisualisationDefinition = new MutationHistoryItemVisualisationDefinition(mutationHistory, 'mdi-table', i18n.global.t('mutationHistoryViewer.record.type.schema.title', { entityType: mutationHistory.entityType }), undefined, this.constructMetadata(mutationHistory), ImmutableList())


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
        ctx.addRootVisualisedRecord(visualisedRecord)
    }

    private constructMetadata(mutationHistory: ChangeCatalogCapture): MetadataGroup[] {
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

    static mutationCount(mutationCount: number): MetadataItem {
        return new MetadataItem(
            metadataItemIoFetchCountIdentifier,
            'mdi-download-network-outline',
            i18n.global.t('mutationHistoryViewer.record.type.transaction.mutationCount.tooltip'),
            i18n.global.t(
                'mutationHistoryViewer.record.type.transaction.mutationCount.value',
                { count: formatCount(mutationCount) }
            )
        )
    }


    static mutationType(mutationType: any): MetadataItem {
        return new MetadataItem(
            metadataItemSessionIdIdentifier,
            'mdi-file-tree',
            i18n.global.t('mutationHistoryViewer.record.type.attribute.mutationType.tooltip'),
            mutationType?.toString(),
            MetadataItemSeverity.Info,
            undefined,
            undefined
        )
    }

}
