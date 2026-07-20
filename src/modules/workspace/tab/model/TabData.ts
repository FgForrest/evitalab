import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'

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

/**
 * Existential alias for tab data of any concrete DTO type — used where tabs of
 * differing types are handled uniformly (heterogeneous collections).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- existential generic slot
export type AnyTabData = TabData<any>
