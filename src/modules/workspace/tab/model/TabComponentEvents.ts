import type { AnyTabData } from '@/modules/workspace/tab/model/TabData'

/**
 * Represents basic events every tab component should emit.
 */
export interface TabComponentEvents {
    /**
     * Emitted when the tab component is ready to be used.
     */
    (e: 'ready'): void

    /**
     * Emitted when the tab component failed to initialize. The tab framework reacts by
     * switching to the error/retry presentation instead of keeping the loading screen visible.
     */
    (e: 'error', error?: Error): void

    /**
     * Emitted when the tab component's data has been updated.
     */
    (e: 'update:data', value: AnyTabData): void
}
