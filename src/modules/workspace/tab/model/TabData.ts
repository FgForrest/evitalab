import { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'

/**
 * Represents injectable/storable data of a component. This is used to pre-fill the component with
 * valid user data. This can be used, e.g., to pre-fill a query editor with a query, so it can be executed right away.
 * Also, the component should provide updated data when user changes them, so they can be stored for later
 * reconstruction of tabs.
 */
export interface TabData<DTO extends TabDataDto> {

    /**
     * Converts the params to a DTO that can be safely serialized.
     */
    toSerializable(): DTO
}
