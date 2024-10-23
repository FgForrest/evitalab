import { ToastInterface } from 'vue-toastification/src/ts/interface'
import { ToastOptions } from 'vue-toastification/dist/types/types'
import { TYPE } from 'vue-toastification/src/ts/constants'
import { v4 as uuidv4 } from 'uuid'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { LabError } from '@/modules/base/exception/LabError'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'
import { ErrorViewerTabFactory } from '@/modules/error-viewer/viewer/workspace/service/ErrorViewerTabFactory'

export const toasterInjectionKey: InjectionKey<Toaster> = Symbol('toaster')

/**
 * Wrapper around the toastification plugin. Provides a more convenient API for firing toast notifications
 * with built-in features specific to evitaLab needs.
 */
export class Toaster {
    private readonly toast: ToastInterface
    private readonly workspaceService: WorkspaceService
    private readonly errorViewerTabFactory: ErrorViewerTabFactory

    constructor(toast: ToastInterface, workspaceService: WorkspaceService, errorViewerTabFactory: ErrorViewerTabFactory) {
        this.toast = toast
        this.workspaceService = workspaceService
        this.errorViewerTabFactory = errorViewerTabFactory
    }

    success(title: string): void {
        this.toast.success(title, { icon: 'mdi mdi-check-circle-outline'})
    }

    info(title: string): void {
        this.toast.info(title, { icon: 'mdi mdi-information-outline' })
    }

    warning(title: string): void {
        this.toast.warning(title, { icon: 'mdi mdi-alert-outline' })
    }

    // todo lho accept both public message and error for details
    error(error: Error | String): void {
        console.error(error)

        if (typeof error === 'string') {
            this.toast.error(error, { icon: 'mdi mdi-alert-circle-outline' })
            return
        }

        if (error instanceof LabError) {
            if (error.detail == undefined) {
                this.toast.error(error.message, { icon: 'mdi mdi-alert-circle-outline' })
            } else {
                this.toast.error(
                    error.message,
                    this.createErrorOptions(error)
                )
            }
        } else if (error instanceof Error) {
            this.error(new UnexpectedError(error.message))
        }
    }

    private createErrorOptions(error: LabError): ToastOptions & { type?: TYPE.ERROR } {
        const id: string = uuidv4()
        return {
            id,
            icon: 'mdi mdi-alert-circle-outline',
            onClick: () => {
                this.workspaceService.createTab(this.errorViewerTabFactory.createNew(error))
                this.toast.dismiss(id)
            }
        }
    }
}

export const useToaster = (): Toaster => {
    return mandatoryInject(toasterInjectionKey) as Toaster
}
