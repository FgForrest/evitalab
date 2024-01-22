import {
    TabRequestComponentData,
    TabRequestComponentDataDto,
    TabRequestComponentParamsDto
} from '@/model/editor/editor'
import { TabType } from '@/model/editor/tab/tab-type'

/**
 * Represents an object that holds serializable info about a specific tab.
 */
export abstract class SerializableTabObject {
    readonly tabType: TabType
    readonly tabParams: TabRequestComponentParamsDto
    readonly tabData: TabRequestComponentData

    protected constructor(tabType: TabType, tabParams: TabRequestComponentParamsDto, tabData: TabRequestComponentDataDto) {
        this.tabType = tabType
        this.tabParams = tabParams
        this.tabData = tabData
    }
}
