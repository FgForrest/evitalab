import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { LabStorage, labStorageInjectionKey } from '@/modules/storage/LabStorage'
import { LabServerDataCache, labServerDataCacheInjectionKey } from '@/modules/storage/LabServerDataCache'
import { EvitaLabConfig, evitaLabConfigInjectionKey } from '@/modules/config/EvitaLabConfig'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

export class StorageModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaLabConfig: EvitaLabConfig = builder.inject(evitaLabConfigInjectionKey)

        builder.provide(
            labStorageInjectionKey,
            new LabStorage(evitaLabConfig.serverName)
        )
        builder.provide(
            labServerDataCacheInjectionKey,
            new LabServerDataCache(evitaLabConfig.serverName)
        )
    }
}
