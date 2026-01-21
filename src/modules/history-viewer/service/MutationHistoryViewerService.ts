import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import { List as ImmutableList } from 'immutable'
import type { MutationHistoryRequest } from '@/modules/history-viewer/model/MutationHistoryRequest.ts'
import type { MutationHistoryCriteria } from '@/modules/history-viewer/model/MutationHistoryCriteria.ts'
import type {
    MutationHistoryVisualisationProcessor
} from '@/modules/history-viewer/service/MutationHistoryVisualisationProcessor.ts'
import {
    MutationHistoryItemVisualisationDefinition
} from '@/modules/history-viewer/model/MutationHistoryItemVisualisationDefinition.ts'

export const historyViewerServiceInjectionKey: InjectionKey<MutationHistoryViewerService> = Symbol('mutationHistoryViewerService')

export class MutationHistoryViewerService {

    private readonly evitaClient: EvitaClient

    private readonly visualisationProcessor: MutationHistoryVisualisationProcessor

    constructor(evitaClient: EvitaClient, visualisationProcessor: MutationHistoryVisualisationProcessor) {
        this.evitaClient = evitaClient
        this.visualisationProcessor = visualisationProcessor
    }


    async getMutationHistoryList(catalogName: string,
                                 mutationHistoryRequest: MutationHistoryRequest,
                           limit: number): Promise<ImmutableList<ChangeCatalogCapture>> {
        return await this.evitaClient.queryCatalog(
            catalogName,
            session => session.getMutationHistory(mutationHistoryRequest, limit)
        )
    }

    async processRecords(catalogName: string,
                         historyCriteria: MutationHistoryCriteria,
                         records: ChangeCatalogCapture[]): Promise<ImmutableList<MutationHistoryItemVisualisationDefinition>> {
        return await this.visualisationProcessor.process(catalogName, historyCriteria, records)
    }


}

export function useMutationHistoryViewerService(): MutationHistoryViewerService {
    return mandatoryInject(historyViewerServiceInjectionKey)
}
