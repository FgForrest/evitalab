import { TabRequestComponentParams } from '@/model/editor/tab/TabRequestComponentParams'
import { TabRequestComponentData } from '@/model/editor/tab/TabRequestComponentData'

/**
 * Props of a component to be instantiated inside a tab. It is dynamically created from passed {@link TabRequestComponentParams}
 * and {@link TabRequestComponentData}.
 */
export type TabComponentProps<PARAMS extends TabRequestComponentParams<any>, DATA extends TabRequestComponentData<any>> = {

    readonly id: string
    readonly params: PARAMS
    readonly data: DATA
}

