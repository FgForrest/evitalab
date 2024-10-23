import { ModuleRegistrar } from '@/ModuleRegistrar'
import { ToastInterface } from 'vue-toastification/src/ts/interface'
import { useToast as baseUseToast } from 'vue-toastification'
import { WorkspaceService, workspaceServiceInjectionKey } from '@/modules/workspace/service/WorkspaceService'
import { Toaster, toasterInjectionKey } from '@/modules/notification/service/Toaster'
import {
    ErrorViewerTabFactory,
    errorViewerTabFactoryInjectionKey
} from '@/modules/error-viewer/viewer/workspace/service/ErrorViewerTabFactory'
import { ModuleContextBuilder } from '@/ModuleContextBuilder'

// todo lho docs
export class NotificationModuleRegistrar implements ModuleRegistrar {

    register(builder: ModuleContextBuilder): void {
        const baseToast: ToastInterface = baseUseToast()
        const workspaceService: WorkspaceService = builder.inject(workspaceServiceInjectionKey)
        const errorViewerTabFactory: ErrorViewerTabFactory = builder.inject(errorViewerTabFactoryInjectionKey)

        builder.provide(
            toasterInjectionKey,
            new Toaster(baseToast, workspaceService, errorViewerTabFactory)
        )
    }
}
