import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import { EvitaLabConfig, evitaLabConfigInjectionKey } from '@/modules/config/EvitaLabConfig'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

export class ConnectionModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): Promise<void> {
        const evitaLabConfig: EvitaLabConfig = builder.inject(evitaLabConfigInjectionKey)

        const connectionService: ConnectionService = ConnectionService.load(evitaLabConfig)
        builder.provide(connectionServiceInjectionKey, connectionService)
        return Promise.resolve()
    }
}
