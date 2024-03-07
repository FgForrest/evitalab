import { TabType } from '@/model/editor/tab/TabType'
import { TabRequestComponentParamsDto } from '@/model/editor/tab/TabRequestComponentParamsDto'
import { TabRequestComponentDataDto } from '@/model/editor/tab/TabRequestComponentDataDto'

/**
 * Represents an object that holds serializable info about a specific tab.
 */
export abstract class SerializableTabObject {
    readonly tabType: TabType
    readonly tabParams: TabRequestComponentParamsDto
    readonly tabData: TabRequestComponentDataDto

    protected constructor(tabType: TabType, tabParams: TabRequestComponentParamsDto, tabData: TabRequestComponentDataDto) {
        this.tabType = tabType
        this.tabParams = tabParams
        this.tabData = tabData
    }
}
