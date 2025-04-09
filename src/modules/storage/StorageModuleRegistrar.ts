import { ModuleRegistrar } from '@/ModuleRegistrar'
import { LabStorage, labStorageInjectionKey } from '@/modules/storage/LabStorage'
import { EvitaLabConfig, evitaLabConfigInjectionKey } from '@/modules/config/EvitaLabConfig'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

// todo docs
export class StorageModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaLabConfig: EvitaLabConfig = builder.inject(evitaLabConfigInjectionKey)

        builder.provide(
            labStorageInjectionKey,
            new LabStorage(evitaLabConfig.serverName)
        )
    }
}
