import type { TabParams } from '@/modules/workspace/tab/model/TabParams'
import type { TabData } from '@/modules/workspace/tab/model/TabData'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'

/**
 * Props of a component to be instantiated inside a tab. It is dynamically created from passed {@link TabParams}
 * and {@link TabData}.
 */
export type TabComponentProps<PARAMS extends TabParams<TabParamsDto>, DATA extends TabData<TabDataDto>> = {

    readonly id: string
    readonly params: PARAMS
    readonly data: DATA
}

