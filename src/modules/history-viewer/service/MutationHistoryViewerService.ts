import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import type {
    GetMutationsHistoryResponse
} from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaSessionAPI_pb.ts'

export const historyViewerServiceInjectionKey: InjectionKey<MutationHistoryViewerService> = Symbol('mutationHistoryViewerService')

export class MutationHistoryViewerService {

    private readonly evitaClient: EvitaClient

    // private readonly visualisationProcessor: TrafficRecordHistoryVisualisationProcessor

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
        // this.visualisationProcessor = visualisationProcessor
    }


    async getMutationHistory(catalogName: string): Promise<GetMutationsHistoryResponse> {
        return await this.evitaClient.queryCatalog(
            catalogName,
            async session => await session.getMutationHistory()
        )
    }

}

export function useMutationHistoryViewerService(): MutationHistoryViewerService {
    return mandatoryInject(historyViewerServiceInjectionKey) as MutationHistoryViewerService
}
