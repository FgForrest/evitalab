import { TabData } from '@/modules/workspace/tab/model/TabData'
import { VoidTabDataDto } from '@/modules/workspace/tab/model/void/VoidTabDataDto'

/**
 * Represents injectable/storable data of a component that doesn't support any user data.
 */
export class VoidTabData implements TabData<VoidTabDataDto> {

    toSerializable(): VoidTabDataDto {
        return {}
    }
}
