import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import {
    ServerViewerService,
    serverViewerServiceInjectionKey
} from '@/modules/server-viewer/service/ServerViewerService'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'

export class ServerViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const serverViewerService: ServerViewerService = new ServerViewerService(evitaClient)
        builder.provide(serverViewerServiceInjectionKey, serverViewerService)
    }
}
