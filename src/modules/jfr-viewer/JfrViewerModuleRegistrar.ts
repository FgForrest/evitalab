import { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { JfrViewerService, jfrViewerServiceInjectionKey } from '@/modules/jfr-viewer/service/JfrViewerService'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'

export class JfrViewerModuleRegistrar implements ModuleRegistrar {
    register(builder: ModuleContextBuilder): void {
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const jfrService: JfrViewerService = new JfrViewerService(connectionService)
        builder.provide(jfrViewerServiceInjectionKey, jfrService)
    }
}
