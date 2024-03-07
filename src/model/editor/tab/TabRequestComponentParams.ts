import { TabRequestComponentParamsDto } from '@/model/editor/tab/TabRequestComponentParamsDto'

/**
 * Interface that is supposed to represent props of a component that is used to render inside a tab.
 */
export interface TabRequestComponentParams<DTO extends TabRequestComponentParamsDto> {

    /**
     * Converts the params to a DTO that can be safely serialized.
     */
    toSerializable(): DTO
}
