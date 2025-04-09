import { InjectionKey } from 'vue'
import { mandatoryInject } from '@/utils/reactivity'

export const toasterInjectionKey: InjectionKey<Toaster> = Symbol('toaster')

/**
 * Executed when a notification has been clicked
 */
export type ToastClickCallback = (dismiss: () => void) => void

/**
 * Provides a convenient API for firing toast notifications
 * with built-in features specific to evitaLab needs.
 */
export interface Toaster {

    success(title: string, clickCallback?: ToastClickCallback): Promise<void>

    info(title: string, clickCallback?: ToastClickCallback): Promise<void>

    warning(title: string, clickCallback?: ToastClickCallback): Promise<void>

    error(title: string, error?: Error): Promise<void>
}

export const useToaster = (): Toaster => {
    return mandatoryInject(toasterInjectionKey) as Toaster
}
