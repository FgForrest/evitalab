import { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { JfrViewerService, jfrViewerServiceInjectionKey } from '@/modules/jfr-viewer/service/JfrViewerService'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'

export class JfrViewerModuleRegistrar implements ModuleRegistrar {
    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const jfrService: JfrViewerService = new JfrViewerService(evitaClient)
        builder.provide(jfrViewerServiceInjectionKey, jfrService)
    }
}
