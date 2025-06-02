import { mandatoryInject } from '@/utils/reactivity'
import { InjectionKey } from 'vue'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { ServerStatus } from '@/modules/database-driver/request-response/status/ServerStatus'

export const serverViewerServiceInjectionKey: InjectionKey<ServerViewerService> = Symbol('serverViewerService')

export class ServerViewerService {
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async getServerStatus(): Promise<ServerStatus> {
        return await this.evitaClient.management.getServerStatus()
    }

    async getRuntimeConfiguration(): Promise<string> {
        return await this.evitaClient.management.getConfiguration()
    }
}

export const useServerViewerService = (): ServerViewerService => {
    return mandatoryInject(serverViewerServiceInjectionKey) as ServerViewerService
}
