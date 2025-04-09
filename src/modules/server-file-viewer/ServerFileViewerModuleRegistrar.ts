import { ModuleRegistrar } from '@/ModuleRegistrar'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'
import {
    ServerFileViewerService,
    serverFileViewerServiceInjectionKey
} from '@/modules/server-file-viewer/service/ServerFileViewerService'

export class ServerFileViewerModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const serverFileViewerService: ServerFileViewerService = new ServerFileViewerService(connectionService)
        builder.provide(serverFileViewerServiceInjectionKey, serverFileViewerService)
    }
}
