import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { Connection } from '@/modules/connection/model/Connection'
import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { EventType } from '@/modules/connection/model/jfr/EventType'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { jfrRecorderTaskName } from '@/modules/jfr-viewer/model/JfrRecorderTask'
import { PaginatedList } from '@/modules/connection/model/PaginatedList'
import { ServerFile } from '@/modules/connection/model/server-file/ServerFile'

export const jfrViewerServiceInjectionKey: InjectionKey<JfrViewerService> = Symbol('jfrViewerService')

export class JfrViewerService {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    async getRecordings(connection: Connection):Promise<PaginatedList<ServerFile>>{
        const driver = await this.connectionService.getDriver(connection)
        return await driver.getFilesToFetch(connection, jfrRecorderTaskName, 1,20)
    }

    async downloadFile(connection: Connection, fileId: Uuid):Promise<Blob> {
        const driver = await this.connectionService.getDriver(connection)
        return await driver.downloadFile(connection, fileId)
    }

    async getEventTypes(connection: Connection):Promise<EventType[]>{
        const driver = await this.connectionService.getDriver(connection)
        return await driver.downloadRecordingEventTypes(connection)
    }

    async startRecording(connection: Connection, entityTypes: string[]): Promise<boolean> {
        const driver = await this.connectionService.getDriver(connection)
        return await driver.startJrfRecording(connection, entityTypes)
    }

    async stopRecording(connection: Connection): Promise<boolean>{
        const driver = await this.connectionService.getDriver(connection)
        return await driver.stopJfrRecording(connection)
    }
}

export const useJfrViewerService = (): JfrViewerService => {
    return mandatoryInject(jfrViewerServiceInjectionKey) as JfrViewerService
}
