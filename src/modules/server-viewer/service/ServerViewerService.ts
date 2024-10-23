import { EvitaDBDriverResolver } from '@/modules/connection/driver/EvitaDBDriverResolver'
import { Connection } from '@/modules/connection/model/Connection'
import { mandatoryInject } from '@/utils/reactivity'
import { InjectionKey } from 'vue'
import { ServerStatus } from '@/modules/connection/model/status/ServerStatus'

export const serverViewerServiceInjectionKey: InjectionKey<ServerViewerService> = Symbol('serverViewerService')

// todo docs
export class ServerViewerService {
    private readonly evitaDBDriverResolver: EvitaDBDriverResolver

    constructor(evitaDBDriver: EvitaDBDriverResolver) {
        this.evitaDBDriverResolver = evitaDBDriver
    }

    async getServerStatus(connection: Connection):Promise<ServerStatus> {
        const driver = await this.evitaDBDriverResolver.resolveDriver(connection)
        return await driver.getServerStatus(connection)
    }

    async getRuntimeConfiguration(connection: Connection): Promise<string> {
        const driver = await this.evitaDBDriverResolver.resolveDriver(connection)
        return await driver.getRuntimeConfiguration(connection)
    }
}

export const useServerViewerService = (): ServerViewerService => {
    return mandatoryInject(serverViewerServiceInjectionKey) as ServerViewerService
}
