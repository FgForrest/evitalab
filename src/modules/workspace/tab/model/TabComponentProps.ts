import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { TabData } from '@/modules/workspace/tab/model/TabData'

/**
 * Props of a component to be instantiated inside a tab. It is dynamically created from passed {@link TabParams}
 * and {@link TabData}.
 */
export type TabComponentProps<PARAMS extends TabParams<any>, DATA extends TabData<any>> = {

    readonly id: string
    readonly params: PARAMS
    readonly data: DATA
}

