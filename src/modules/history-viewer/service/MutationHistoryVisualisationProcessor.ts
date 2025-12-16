import { List as ImmutableList } from 'immutable'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import type { MutationVisualiser } from '@/modules/history-viewer/service/MutationVisualiser.ts'
import {
    MutationHistoryItemVisualisationDefinition
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'
import type { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import type { MutationHistoryCriteria } from '@/modules/history-viewer/model/MutationHistoryCriteria.ts'
import {
    MutationHistoryVisualisationContext
} from '@/modules/history-viewer/model/MutationHistoryVisualisationContext.ts'

/**
 * Takes raw flat mutation history records from server and processes them into visualisable tree structure.
 */
export class MutationHistoryVisualisationProcessor {

    private readonly visualisers: ImmutableList<MutationVisualiser<any>>

    constructor(visualisers: ImmutableList<MutationVisualiser<any>>) {
        this.visualisers = visualisers
    }

    async process(catalogName: string,
                  historyCriteria: MutationHistoryCriteria,
                  records: ChangeCatalogCapture[]): Promise<ImmutableList<MutationHistoryItemVisualisationDefinition>> {


        const visualisationContext: MutationHistoryVisualisationContext = new MutationHistoryVisualisationContext(catalogName, historyCriteria)
        for (const record of records) {
            this.visualiseRecord(visualisationContext, record)
        }
        return visualisationContext.getVisualisedRecords()
    }



    private visualiseRecord(ctx: MutationHistoryVisualisationContext, record: ChangeCatalogCapture): void {
        for (const visualiser of this.visualisers) {
            if (visualiser.canVisualise(record)) {
                visualiser.visualise(ctx, record)
                return
            }
        }
        throw new UnexpectedError(`No visualiser was found for '${record.operation}'.`);
    }
}
