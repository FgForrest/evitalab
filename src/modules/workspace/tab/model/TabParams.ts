import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'

/**
 * Interface that is supposed to represent props of a component that is used to render inside a tab.
 */
export interface TabParams<DTO extends TabParamsDto> {

    /**
     * Converts the params to a DTO that can be safely serialized.
     */
    toSerializable(): DTO
}

/**
 * Existential alias for tab params of any concrete DTO type — used where tabs of
 * differing types are handled uniformly (heterogeneous collections).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- existential generic slot
export type AnyTabParams = TabParams<any>
