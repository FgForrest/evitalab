import { useToast as baseUseToast } from 'vue-toastification'
import { ToastInterface } from 'vue-toastification/src/ts/interface'
import { ToastOptions } from 'vue-toastification/dist/types/types'
import { TYPE } from 'vue-toastification/src/ts/constants'
import { EditorService, useEditorService } from '@/services/editor/editor.service'
import { v4 as uuidv4 } from 'uuid'
import { LabError, UnexpectedError } from '@/model/lab'
import { ErrorViewerRequest } from '@/model/editor/error-viewer-request'

/**
 * Wrapper around the toastification plugin. Provides a more convenient API for firing toast notifications
 * with built-in features specific to evitaLab needs.
 */
export class Toaster {
    readonly toast: ToastInterface
    readonly editorService: EditorService

    constructor(toast: ToastInterface, editorService: EditorService) {
        this.toast = toast
        this.editorService = editorService
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
            this.error(new UnexpectedError(undefined, error.message))
        }
    }

    private createErrorOptions(error: LabError): ToastOptions & { type?: TYPE.ERROR } {
        const id: string = uuidv4()
        return {
            id,
            icon: 'mdi mdi-alert-circle-outline',
            onClick: () => {
                this.editorService.createTabRequest(new ErrorViewerRequest(error.connection, error))
                this.toast.dismiss(id)
            }
        }
    }
}

export function useToaster() {
    const toast: ToastInterface = baseUseToast()
    const editorService: EditorService = useEditorService()
    return new Toaster(toast, editorService)
}
