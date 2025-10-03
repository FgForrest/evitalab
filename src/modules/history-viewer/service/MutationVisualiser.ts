import {
    MutationHistoryPreparationContext
} from '@/modules/history-viewer/service/MutationHistoryPreparationContext.ts'
import type { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import {
    MutationHistoryVisualisationContext
} from '@/modules/history-viewer/model/MutationHistoryVisualisationContext.ts'

/**
 * Provides definition about how to visualise traffic record to user
 */
export abstract class MutationVisualiser<R extends ChangeCatalogCapture> {

    /**
     * Determines if this visualiser can visualise this record
     */
    abstract canVisualise(trafficRecord: ChangeCatalogCapture): boolean

    /**
     * Can be overridden for doing some preparation work for the entire history
     * before actual visualisation
     */
    prepare(ctx: MutationHistoryPreparationContext, trafficRecord: R): void {
        // do nothing by default
    }

    /**
     * Creates visualisation definition for this traffic record. Can return `null` if particular record shouldn't be visualised
     */
    abstract visualise(ctx: MutationHistoryVisualisationContext, trafficRecord: R): void
}
