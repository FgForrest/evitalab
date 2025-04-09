import { ModuleRegistrar } from '@/ModuleRegistrar'
import { WorkspaceService, workspaceServiceInjectionKey } from '@/modules/workspace/service/WorkspaceService'
import { toasterInjectionKey } from '@/modules/notification/service/Toaster'
import {
    ErrorViewerTabFactory,
    errorViewerTabFactoryInjectionKey
} from '@/modules/error-viewer/viewer/workspace/service/ErrorViewerTabFactory'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'
import { EvitaLabConfig, evitaLabConfigInjectionKey } from '@/modules/config/EvitaLabConfig'
import { ToasterFactory } from '@/modules/notification/service/ToasterFactory'
import { ConnectionService, connectionServiceInjectionKey } from '@/modules/connection/service/ConnectionService'

// todo lho docs
export class NotificationModuleRegistrar implements ModuleRegistrar {

    async register(builder: ModuleContextBuilder): Promise<void> {
        const evitaLabConfig: EvitaLabConfig = builder.inject(evitaLabConfigInjectionKey)
        const connectionService: ConnectionService = builder.inject(connectionServiceInjectionKey)
        const workspaceService: WorkspaceService = builder.inject(workspaceServiceInjectionKey)
        const errorViewerTabFactory: ErrorViewerTabFactory = builder.inject(errorViewerTabFactoryInjectionKey)

        builder.provide(
            toasterInjectionKey,
            ToasterFactory.createToaster(
                evitaLabConfig,
                connectionService,
                workspaceService,
                errorViewerTabFactory
            )
        )
    }
}
