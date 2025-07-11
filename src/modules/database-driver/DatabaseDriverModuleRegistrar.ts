import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaLabConfig, evitaLabConfigInjectionKey } from '@/modules/config/EvitaLabConfig'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'

export class DatabaseDriverModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaLabConfig: EvitaLabConfig = builder.inject(evitaLabConfigInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)

        const evitaClient: EvitaClient = new EvitaClient(evitaLabConfig, connectionService)
        builder.provide(evitaClientInjectionKey, evitaClient)
    }

}
