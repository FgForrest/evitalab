import {
    TabRequestComponentDataDto,
    TabRequestComponentParamsDto
} from '@/model/editor/editor'
import LZString from 'lz-string'
import { SerializableTabObject } from '@/model/editor/tab/serializable-tab-object'
import { TabType } from '@/model/editor/tab/tab-type'

/**
 * Used to share a tab and its data between browsers (users).
 */
export class ShareTabObject extends SerializableTabObject {

    constructor(tabType: TabType, tabParams: TabRequestComponentParamsDto, tabData: TabRequestComponentDataDto) {
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
