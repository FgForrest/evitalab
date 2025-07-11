import type { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import {
    ServerFileViewerService,
    serverFileViewerServiceInjectionKey
} from '@/modules/server-file-viewer/service/ServerFileViewerService'
import { EvitaClient, evitaClientInjectionKey } from '@/modules/database-driver/EvitaClient'

export class ServerFileViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaClient: EvitaClient = builder.inject(evitaClientInjectionKey)
        const serverFileViewerService: ServerFileViewerService = new ServerFileViewerService(evitaClient)
        builder.provide(serverFileViewerServiceInjectionKey, serverFileViewerService)
    }
}
