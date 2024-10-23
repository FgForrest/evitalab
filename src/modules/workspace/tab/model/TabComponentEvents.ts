import { TabData } from '@/modules/workspace/tab/model/TabData'

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
    (e: 'dataUpdate', value: TabData<any>): void
}
