import { Uuid } from '@/modules/database-driver/data-type/Uuid'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'

export const serverFileViewerServiceInjectionKey: InjectionKey<ServerFileViewerService> = Symbol('serverFileViewerService')

export class ServerFileViewerService {
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async deleteFile(fileId: Uuid): Promise<boolean> {
        return this.evitaClient.management.deleteFile(fileId)
    }
}

export function useServerFileViewerService(): ServerFileViewerService {
    return mandatoryInject(serverFileViewerServiceInjectionKey) as ServerFileViewerService
}
