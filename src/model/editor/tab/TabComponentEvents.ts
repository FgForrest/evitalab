import { TabRequestComponentData } from '@/model/editor/tab/TabRequestComponentData'

/**
 * Represents basic events every tab component should emit.
 */
export interface TabComponentEvents {
    /**
     * Emitted when the tab component is ready to be used.
     */
    (e: 'ready'): void

    /**
     * Emitted when the tab component's data has been updated.
     */
    (e: 'dataUpdate', value: TabRequestComponentData<any>): void
}
