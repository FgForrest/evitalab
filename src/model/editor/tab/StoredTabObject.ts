import { SerializableTabObject } from '@/model/editor/tab/SerializableTabObject'
import LZString from 'lz-string'
import { TabType } from '@/model/editor/tab/TabType'
import { TabRequestComponentParamsDto } from '@/model/editor/tab/TabRequestComponentParamsDto'
import { TabRequestComponentDataDto } from '@/model/editor/tab/TabRequestComponentDataDto'

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
