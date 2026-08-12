import type { ModuleRegistrar } from '@/ModuleRegistrar'
import {
    WelcomeScreenService,
    welcomeScreenServiceInjectionKey
} from '@/modules/welcome-screen/service/WelcomeScreenService'
import { useWelcomeScreenStore } from '@/modules/welcome-screen/store/welcomeScreenStore'
import type { WelcomeScreenStore } from '@/modules/welcome-screen/store/welcomeScreenStore'
import { EvitaLabConfig, evitaLabConfigInjectionKey } from '@/modules/config/EvitaLabConfig'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaDBDocsClient } from '@/modules/welcome-screen/service/EvitaDBDocsClient'

/**
 * Registers the welcome screen module which renders the initial landing page of the lab with links to
 * evitaDB documentation and blog posts.
 */
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
