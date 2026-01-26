import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { JfrViewerService, jfrViewerServiceInjectionKey } from '@/modules/jfr-viewer/service/JfrViewerService'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'

export class JfrViewerModuleRegistrar implements ModuleRegistrar {
    register(builder: ModuleContextBuilder): void {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const jfrService: JfrViewerService = new JfrViewerService(evitaClient)
        builder.provide(jfrViewerServiceInjectionKey, jfrService)
    }
}
