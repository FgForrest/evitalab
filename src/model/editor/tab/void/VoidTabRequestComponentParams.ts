import { TabRequestComponentParams } from '@/model/editor/tab/TabRequestComponentParams'
import { VoidTabRequestComponentParamsDto } from '@/model/editor/tab/void/VoidTabRequestComponentParamsDto'

/**
 * Represents injectable/storable params of a component that doesn't support parametrization. This is useful for tabs
 * that open always the same static content.
 */
export class VoidTabRequestComponentParams implements TabRequestComponentParams<VoidTabRequestComponentParamsDto> {

    toSerializable(): VoidTabRequestComponentParamsDto {
        return {}
    }
}
