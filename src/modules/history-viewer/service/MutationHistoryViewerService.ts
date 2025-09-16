import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type { ChangeCatalogCapture } from '@/modules/database-driver/request-response/cdc/ChangeCatalogCapture.ts'
import { List as ImmutableList } from 'immutable'

export const historyViewerServiceInjectionKey: InjectionKey<MutationHistoryViewerService> = Symbol('mutationHistoryViewerService')

export class MutationHistoryViewerService {

    private readonly evitaClient: EvitaClient

    // private readonly visualisationProcessor: TrafficRecordHistoryVisualisationProcessor

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
        // this.visualisationProcessor = visualisationProcessor
    }


    getMutationHistory(catalogName: string): Promise<ImmutableList<ChangeCatalogCapture>> {
        return this.evitaClient.queryCatalog(
            catalogName,
            async session => await session.getMutationHistory()
        )
    }

}

export function useMutationHistoryViewerService(): MutationHistoryViewerService {
    return mandatoryInject(historyViewerServiceInjectionKey) as MutationHistoryViewerService
}
