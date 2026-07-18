import type { TabParams, AnyTabParams } from '@/modules/workspace/tab/model/TabParams'
import type { TabData, AnyTabData } from '@/modules/workspace/tab/model/TabData'

/**
 * Props of a component to be instantiated inside a tab. It is dynamically created from passed {@link TabParams}
 * and {@link TabData}.
 */
export type TabComponentProps<PARAMS extends AnyTabParams, DATA extends AnyTabData> = {

    readonly id: string
    readonly params: PARAMS
    readonly data: DATA
}

