import { ToastClickCallback, Toaster } from '@/modules/notification/service/Toaster'
import { LabNotificationManagerIpc } from '@/modules/desktop-support/ipc/notification/service/LabNotificationManagerIpc'
import { NotificationId } from '@/modules/desktop-support/ipc/notification/model/NotificationId'
import { NotificationSeverity } from '@/modules/desktop-support/ipc/notification/model/NotificationSeverity'
import { InstanceNotificationSource } from '@/modules/desktop-support/ipc/notification/model/InstanceNotificationSource'
import { ConnectionService } from '@/modules/connection/service/ConnectionService'
import { WorkspaceService } from '@/modules/workspace/service/WorkspaceService'
import { ErrorViewerTabFactory } from '@/modules/error-viewer/viewer/workspace/service/ErrorViewerTabFactory'
import { LabError } from '@/modules/base/exception/LabError'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

/**
 * Wrapper around notification manager IPC in driver mode. Toasts are not displayed
 * in lab directly.
 */
export class RemoteToaster implements Toaster {

    private readonly connectionService: ConnectionService
    private readonly workspaceService: WorkspaceService
    private readonly errorViewerTabFactory: ErrorViewerTabFactory
    private readonly notificationManager: LabNotificationManagerIpc

    private readonly toastClickCallback: Map<NotificationId, ToastClickCallback> = new Map()

    constructor(connectionService: ConnectionService,
                workspaceService: WorkspaceService,
                errorViewerTabFactory: ErrorViewerTabFactory) {
        this.connectionService = connectionService
        this.workspaceService = workspaceService
        this.errorViewerTabFactory = errorViewerTabFactory
        this.notificationManager = window.labNotificationManager

        this.notificationManager.onNotificationClicked((id) => {
            const callback: ToastClickCallback | undefined = this.toastClickCallback.get(id)
            if (callback != undefined) {
                callback(
                    () =>{
                        this.notificationManager.requestNotificationClosure(id)
                    }
                )
            }
        })
        this.notificationManager.onNotificationClosed((id) =>
            this.toastClickCallback.delete(id))
    }

    async success(title: string, clickCallback?: ToastClickCallback): Promise<void> {
        await this.addNotification(NotificationSeverity.Success, title, clickCallback)
    }

    async info(title: string, clickCallback?: ToastClickCallback): Promise<void> {
        await this.addNotification(NotificationSeverity.Info, title, clickCallback)
    }

    async warning(title: string, clickCallback?: ToastClickCallback): Promise<void> {
        await this.addNotification(NotificationSeverity.Warning, title, clickCallback)
    }

    async error(title: string, error?: Error): Promise<void> {
        if (error == undefined) {
            await this.addNotification(NotificationSeverity.Error, title)
        } else {
            console.error(error)

            if (error instanceof LabError) {
                if (error.detail == undefined) {
                    await this.addNotification(NotificationSeverity.Error, `${title}: ${error.message}`)
                } else {
                    await this.addNotification(
                        NotificationSeverity.Error,
                        `${title}: ${error.message}`,
                        (dismiss) => {
                            this.workspaceService.createTab(this.errorViewerTabFactory.createNew(error))
                            dismiss()
                        }
                    )
                }
            } else {
                await this.error(title, new UnexpectedError(error.message))
            }
        }
    }

    private async addNotification(severity: NotificationSeverity, title: string, clickCallback?: ToastClickCallback): Promise<void> {
        const id: NotificationId = await this.notificationManager.addNotification({
            severity,
            source: new InstanceNotificationSource(this.connectionService.getDriverConnection().id),
            message: title
        })
        if (clickCallback != undefined) {
            this.toastClickCallback.set(id, clickCallback)
        }
    }
}
