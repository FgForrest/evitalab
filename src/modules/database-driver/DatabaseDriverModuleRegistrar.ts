import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaLabConfig, evitaLabConfigInjectionKey } from '@/modules/config/EvitaLabConfig'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'
import {
    DataCacheRefresher,
    dataCacheRefresherInjectionKey
} from '@/modules/database-driver/DataCacheRefresher'
import { LabServerDataCache, labServerDataCacheInjectionKey } from '@/modules/storage/LabServerDataCache'

export class DatabaseDriverModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaLabConfig: EvitaLabConfig = builder.inject(evitaLabConfigInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const labServerDataCache: LabServerDataCache = builder.inject(labServerDataCacheInjectionKey)

        const evitaClient: EvitaClient = new EvitaClient(evitaLabConfig, connectionService, labServerDataCache)
        builder.provide(evitaClientInjectionKey, evitaClient)

        const dataCacheRefresher: DataCacheRefresher = new DataCacheRefresher(evitaClient)
        builder.provide(dataCacheRefresherInjectionKey, dataCacheRefresher)
        dataCacheRefresher.start()
    }

}
