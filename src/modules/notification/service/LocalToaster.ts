import { ToastClickCallback, Toaster } from '@/modules/notification/service/Toaster'
import { ToastInterface } from 'vue-toastification/src/ts/interface'
import { ToastOptions } from 'vue-toastification/dist/types/types'
import { TYPE } from 'vue-toastification/src/ts/constants'
import { v4 as uuidv4 } from 'uuid'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { LabError } from '@/modules/base/exception/LabError'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { ErrorViewerTabFactory } from '@/modules/error-viewer/viewer/workspace/service/ErrorViewerTabFactory'

const errorToastIcon = 'mdi-alert-circle-outline'

/**
 * Wrapper around the toastification plugin. Provides a more convenient API for firing toast notifications
 * with built-in features specific to evitaLab needs.
 */
export class LocalToaster implements Toaster {
    private readonly toast: ToastInterface
    private readonly workspaceService: WorkspaceService
    private readonly errorViewerTabFactory: ErrorViewerTabFactory

    constructor(toast: ToastInterface, workspaceService: WorkspaceService, errorViewerTabFactory: ErrorViewerTabFactory) {
        this.toast = toast
        this.workspaceService = workspaceService
        this.errorViewerTabFactory = errorViewerTabFactory
    }

    private addNotification(type: TYPE,
                            title: string,
                            icon: string,
                            clickCallback?: ToastClickCallback): void {
        this.toast(
            title,
            {
                type,
                icon: `mdi ${icon}`,
                onClick: clickCallback != undefined
                    ? (closeToast: Function) => clickCallback(() => closeToast())
                    : undefined
            }
        )
    }

    async success(title: string, clickCallback?: ToastClickCallback): Promise<void> {
        this.addNotification(
            TYPE.SUCCESS,
            title,
            'mdi-check-circle-outline',
            clickCallback
        )
    }

    async info(title: string, clickCallback?: ToastClickCallback): Promise<void> {
        this.addNotification(
            TYPE.INFO,
            title,
            'mdi-information-outline',
            clickCallback
        )
    }

    async warning(title: string, clickCallback?: ToastClickCallback): Promise<void> {
        this.addNotification(
            TYPE.WARNING,
            title,
            'mdi-alert-outline',
            clickCallback
        )
    }

    async error(title: string, error?: Error): Promise<void> {
        if (error == undefined) {
            this.addNotification(TYPE.ERROR, title, errorToastIcon)
        } else {
            console.error(error)

            if (error instanceof LabError) {
                console.log(error)
                if (error.detail == undefined) {
                    this.addNotification(
                        TYPE.ERROR,
                        `${title}: ${error.message}`,
                        errorToastIcon
                    )
                } else {
                    this.toast.error(
                        `${title}: ${error.message}`,
                        this.createErrorOptions(error)
                    )
                }
            } else {
                await this.error(title, new UnexpectedError(error.message))
            }
        }
    }

    private createErrorOptions(error: LabError): ToastOptions & { type?: TYPE.ERROR } {
        const id: string = uuidv4()
        return {
            id,
            icon: `mdi ${errorToastIcon}`,
            onClick: () => {
                this.workspaceService.createTab(this.errorViewerTabFactory.createNew(error))
                this.toast.dismiss(id)
            }
        }
    }
}
