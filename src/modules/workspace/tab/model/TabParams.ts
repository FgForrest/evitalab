import { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'

/**
 * Interface that is supposed to represent props of a component that is used to render inside a tab.
 */
export interface TabParams<DTO extends TabParamsDto> {

    /**
     * Converts the params to a DTO that can be safely serialized.
     */
    toSerializable(): DTO
}
