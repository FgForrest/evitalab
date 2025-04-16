import { TabType } from '@/modules/workspace/tab/model/TabType'
import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'

/**
 * Represents an object that holds serializable info about a specific tab.
 */
export abstract class SerializableTabObject {
    readonly tabType: TabType
    readonly tabParams: TabParamsDto
    readonly tabData?: TabDataDto

    protected constructor(tabType: TabType, tabParams: TabParamsDto, tabData: TabDataDto | undefined) {
        this.tabType = tabType
        this.tabParams = tabParams
        this.tabData = tabData
    }
}
