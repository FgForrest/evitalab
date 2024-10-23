import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { Connection } from '@/modules/connection/model/Connection'
import { Uuid } from '@/modules/connection/model/data-type/Uuid'
import { EvitaDBDriver } from '@/modules/connection/driver/EvitaDBDriver'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'

export const serverFileViewerServiceInjectionKey: InjectionKey<ServerFileViewerService> = Symbol('serverFileViewerService')

export class ServerFileViewerService {
    private readonly connectionService: ConnectionService

    constructor(connectionService: ConnectionService) {
        this.connectionService = connectionService
    }

    async deleteFile(connection: Connection, fileId: Uuid): Promise<boolean> {
        const driver: EvitaDBDriver = await this.connectionService.getDriver(connection)
        return await driver.deleteFile(connection, fileId)
    }
}

export function useServerFileViewerService(): ServerFileViewerService {
    return mandatoryInject(serverFileViewerServiceInjectionKey) as ServerFileViewerService
}
