import type { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { jfrRecorderTaskName } from '@/modules/jfr-viewer/model/JfrRecorderTask'
import { PaginatedList } from '@/modules/database-driver/request-response/PaginatedList'
import { ServerFile } from '@/modules/database-driver/request-response/server-file/ServerFile'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { EventType } from '@/modules/database-driver/request-response/jfr/EventType'

export const jfrViewerServiceInjectionKey: InjectionKey<JfrViewerService> = Symbol('jfrViewerService')

export class JfrViewerService {
    private readonly evitaClient: EvitaClient

    constructor(evitaClient: EvitaClient) {
        this.evitaClient = evitaClient
    }

    async getRecordings(pageNumber: number, pageSize: number): Promise<PaginatedList<ServerFile>> {
        return await this.evitaClient.management.listFilesToFetch(
            pageNumber,
            pageSize,
            [jfrRecorderTaskName]
        )
    }

    async getEventTypes(): Promise<EventType[]> {
        return await this.evitaClient.management.listJfrRecordingEventTypes()
    }

    async startRecording(entityTypes: string[]): Promise<boolean> {
        return await this.evitaClient.management.startJrfRecording(entityTypes)
    }

    async stopRecording(): Promise<boolean> {
        return await this.evitaClient.management.stopJfrRecording()
    }
}

export const useJfrViewerService = (): JfrViewerService => {
    return mandatoryInject(jfrViewerServiceInjectionKey)
}
