import LZString from 'lz-string'
import { SerializableTabObject } from '@/modules/workspace/tab/model/SerializableTabObject'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'

/**
 * Used to share a tab and its data between browsers (users).
 */
export class ShareTabObject extends SerializableTabObject {

    constructor(tabType: TabType, tabParams: TabParamsDto, tabData: TabDataDto | undefined) {
        super(tabType, tabParams, tabData)
    }

    static fromLinkParam(param: string): ShareTabObject {
        const json: any = JSON.parse(LZString.decompressFromEncodedURIComponent(param))
        return new ShareTabObject(json.tabType, json.tabParams, json.tabData)
    }

    toLinkParam(): string {
        const serialized = JSON.stringify(this)
        return LZString.compressToEncodedURIComponent(serialized)
    }
}
