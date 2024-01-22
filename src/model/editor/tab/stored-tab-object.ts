import {
    TabRequestComponentDataDto,
    TabRequestComponentParamsDto
} from '@/model/editor/editor'
import { SerializableTabObject } from '@/model/editor/tab/serializable-tab-object'
import LZString from 'lz-string'
import { TabType } from '@/model/editor/tab/tab-type'

/**
 * Used to store an opened tab between browser sessions.
 */
export class StoredTabObject extends SerializableTabObject {

    constructor(tabType: TabType, tabParams: TabRequestComponentParamsDto, tabData: TabRequestComponentDataDto) {
        super(tabType, tabParams, tabData)
    }

    static restoreFromSerializable(serializable: string): StoredTabObject {
        const json: any = JSON.parse(LZString.decompressFromEncodedURIComponent(serializable))
        return new StoredTabObject(json.tabType, json.tabParams, json.tabData)
    }

    toSerializable(): string {
        const serialized = JSON.stringify(this)
        return LZString.compressToEncodedURIComponent(serialized)
    }
}
