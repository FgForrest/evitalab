import { ModuleRegistrar } from '@/ModuleRegistrar'
import { EvitaLabConfig, evitaLabConfigInjectionKey } from '@/modules/config/EvitaLabConfig'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { Router } from 'vue-router'

// todo docs
export class ConfigModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        const router: Router = builder.app.config.globalProperties.$router
        builder.provide(evitaLabConfigInjectionKey, EvitaLabConfig.load(router))
    }
}
