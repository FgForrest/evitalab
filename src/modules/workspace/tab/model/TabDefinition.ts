import type { Component, Raw } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { AnyTabParams } from '@/modules/workspace/tab/model/TabParams'
import type { AnyTabData } from '@/modules/workspace/tab/model/TabData'
import type { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'

/**
 * Definition to instantiate a new workspace tab from.
 */
export abstract class TabDefinition<PARAMS extends AnyTabParams, DATA extends AnyTabData> {

    readonly id: string
    readonly title: string
    readonly icon: string
    readonly component: Raw<Component>
    readonly params: PARAMS
    readonly initialData: DATA

    /**
     * Indicates whether this tab has been visited by the user or not.
     */
    new: boolean = true

    protected constructor(id: string | undefined,
                          title: string,
                          icon: string,
                          component: Raw<Component>,
                          params: PARAMS,
                          initialData: DATA) {
        this.id = id == undefined ? uuidv4() : id
        this.title = title
        this.icon = icon
        this.component = component
        this.params = params
        this.initialData = initialData
    }

    /**
     * Returns instantiation props for the tab component.
     */
    componentProps(): TabComponentProps<PARAMS, DATA> {
        return {
            id: this.id,
            params: this.params,
            data: this.initialData
        }
    }
}

/**
 * Existential alias for a tab definition of any concrete params/data type — used
 * where tabs of differing types are handled uniformly (heterogeneous collections).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- existential generic slots
export type AnyTabDefinition = TabDefinition<any, any>
