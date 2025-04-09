import { ModuleRegistrar } from '@/ModuleRegistrar'
import {
    WelcomeScreenService,
    welcomeScreenServiceInjectionKey
} from '@/modules/welcome-screen/service/WelcomeScreenService'
import { useWelcomeScreenStore, WelcomeScreenStore } from '@/modules/welcome-screen/store/welcomeScreenStore'
import { EvitaDBDocsClient } from '@/modules/welcome-screen/driver/EvitaDBDocsClient'
import { EvitaLabConfig, evitaLabConfigInjectionKey } from '@/modules/config/EvitaLabConfig'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

// todo docs
export class WelcomeScreenModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const welcomeScreenStore: WelcomeScreenStore = useWelcomeScreenStore()

        const evitaLabConfig: EvitaLabConfig = builder.inject(evitaLabConfigInjectionKey)

        const evitaDBDocsClient: EvitaDBDocsClient = new EvitaDBDocsClient(evitaLabConfig)

        builder.provide(
            welcomeScreenServiceInjectionKey,
            new WelcomeScreenService(welcomeScreenStore, evitaDBDocsClient)
        )
    }
}
