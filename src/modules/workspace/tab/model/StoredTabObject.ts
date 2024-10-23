import LZString from 'lz-string'
import { SerializableTabObject } from '@/modules/workspace/tab/model/SerializableTabObject'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'

/**
 * Used to store an opened tab between browser sessions.
 */
export class StoredTabObject extends SerializableTabObject {

    constructor(tabType: TabType, tabParams: TabParamsDto, tabData: TabDataDto) {
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
