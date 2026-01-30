import type { TabData } from '@/modules/workspace/tab/model/TabData'
import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'

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
    (e: 'update:data', value: TabData<TabDataDto>): void
}
