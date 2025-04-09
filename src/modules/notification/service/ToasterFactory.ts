import { EvitaLabConfig } from '@/modules/config/EvitaLabConfig'
import { Toaster } from '@/modules/notification/service/Toaster'
import { LabRunMode } from '@/LabRunMode'
import { RemoteToaster } from '@/modules/notification/service/RemoteToaster'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { ErrorViewerTabFactory } from '@/modules/error-viewer/viewer/workspace/service/ErrorViewerTabFactory'
import { LocalToaster } from '@/modules/notification/service/LocalToaster'
import { ToastInterface } from 'vue-toastification/src/ts/interface'
import { useToast as baseUseToast } from 'vue-toastification'

/**
 * Instantiates proper toaster for current environment
 */
export class ToasterFactory {

    private constructor() {
        // cannot instantiate
    }

    static createToaster(evitaLabConfig: EvitaLabConfig,
                         connectionService: ConnectionService,
                         workspaceService: WorkspaceService,
                         errorViewerTabFactory: ErrorViewerTabFactory): Toaster {
        if (evitaLabConfig.runMode === LabRunMode.Driver &&
            window.labNotificationManager != undefined) {
            return new RemoteToaster(
                connectionService,
                workspaceService,
                errorViewerTabFactory
            )
        } else {
            const baseToast: ToastInterface = baseUseToast()
            return new LocalToaster(
                baseToast,
                workspaceService,
                errorViewerTabFactory
            )
        }
    }
}
