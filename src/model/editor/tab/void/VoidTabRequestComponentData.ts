import { TabRequestComponentData } from '@/model/editor/tab/TabRequestComponentData'
import { VoidTabRequestComponentDataDto } from '@/model/editor/tab/void/VoidTabRequestComponentDataDto'

/**
 * Represents injectable/storable data of a component that doesn't support any user data.
 */
export class VoidTabRequestComponentData implements TabRequestComponentData<VoidTabRequestComponentDataDto> {

    toSerializable(): VoidTabRequestComponentDataDto {
        return {}
    }
}
