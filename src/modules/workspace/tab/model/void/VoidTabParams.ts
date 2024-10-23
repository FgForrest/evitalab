import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { VoidTabParamsDto } from '@/modules/workspace/tab/model/void/VoidTabParamsDto'

/**
 * Represents injectable/storable params of a component that doesn't support parametrization. This is useful for tabs
 * that open always the same static content.
 */
export class VoidTabParams implements TabParams<VoidTabParamsDto> {

    toSerializable(): VoidTabParamsDto {
        return {}
    }
}
