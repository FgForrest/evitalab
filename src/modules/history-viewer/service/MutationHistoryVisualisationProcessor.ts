import { List as ImmutableList } from 'immutable'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { MutationVisualiser } from '@/modules/history-viewer/service/MutationVisualiser.ts'
import {
    MutationHistoryItemVisualisationDefinition
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'
import {
    MutationHistoryPreparationContext
} from '@/modules/history-viewer/service/MutationHistoryPreparationContext.ts'
import type { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import type { MutationHistoryCriteria } from '@/modules/history-viewer/model/MutationHistoryCriteria.ts'
import {
    MutationHistoryVisualisationContext
} from '@/modules/history-viewer/model/MutationHistoryVisualisationContext.ts'

/**
 * Takes raw flat traffic records from server and processes them into visualisable tree structure.
 */
export class MutationHistoryVisualisationProcessor {

    private readonly evitaClient: EvitaClient
    private readonly visualisers: ImmutableList<MutationVisualiser<any>>

    constructor(evitaClient: EvitaClient, visualisers: ImmutableList<MutationVisualiser<any>>) {
        this.evitaClient = evitaClient
        this.visualisers = visualisers
    }

    async process(catalogName: string,
                  historyCriteria: MutationHistoryCriteria,
                  records: ChangeCatalogCapture[]): Promise<ImmutableList<MutationHistoryItemVisualisationDefinition>> {
        const preparationContext: MutationHistoryPreparationContext = new MutationHistoryPreparationContext()
        for (const record of records) {
            this.prepareRecord(preparationContext, record)
        }

        const recordsToVisualise: ChangeCatalogCapture[] = await this.processPreparedData(
            preparationContext,
            catalogName,
            historyCriteria,
            records
        )

        const visualisationContext: MutationHistoryVisualisationContext = new MutationHistoryVisualisationContext(catalogName, historyCriteria)
        for (const record of recordsToVisualise) {
            this.visualiseRecord(visualisationContext, record)
        }
        return visualisationContext.getVisualisedRecords()
    }

    private async processPreparedData(preparationContext: MutationHistoryPreparationContext,
                                      catalogName: string,
                                      historyCriteria: MutationHistoryCriteria,
                                      records: ChangeCatalogCapture[]): Promise<ChangeCatalogCapture[]> {
        return [...records]
    }






    private prepareRecord(ctx: MutationHistoryPreparationContext, record: ChangeCatalogCapture): void {
        for (const visualiser of this.visualisers) {
            if (visualiser.canVisualise(record)) {
                visualiser.prepare(ctx, record)
                return
            }
        }
        throw new UnexpectedError(`No visualiser was found for '${record.operation}'.`);
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
