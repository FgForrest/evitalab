import { ModuleRegistrar } from '@/ModuleRegistrar'
import { EvitaLabConfig, evitaLabConfigInjectionKey } from '@/modules/config/EvitaLabConfig'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

// todo docs
export class ConfigModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        builder.provide(evitaLabConfigInjectionKey, EvitaLabConfig.load())
    }
}
