import { ModuleRegistrar } from '@/ModuleRegistrar'
import { EvitaLabConfig, evitaLabConfigInjectionKey } from '@/modules/config/EvitaLabConfig'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { Router } from 'vue-router'

// todo docs
export class ConfigModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const router: Router = builder.app.config.globalProperties.$router
        const evitaLabConfig: EvitaLabConfig = await EvitaLabConfig.load(router)
        builder.provide(evitaLabConfigInjectionKey, evitaLabConfig)
    }
}
