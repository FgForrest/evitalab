import { DefineComponent, Raw } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { TabParams } from '@/modules/workspace/tab/model/TabParams'
import { TabData } from '@/modules/workspace/tab/model/TabData'
import { TabComponentProps } from '@/modules/workspace/tab/model/TabComponentProps'

/**
 * Definition to instantiate a new workspace tab from.
 */
export abstract class TabDefinition<PARAMS extends TabParams<any>, DATA extends TabData<any>> {

    readonly id: string
    readonly title: string
    readonly icon: string
    readonly component: Raw<DefineComponent<any, any, any>>
    readonly params: PARAMS
    readonly initialData: DATA

    /**
     * Indicates whether this tab has been visited by the user or not.
     */
    new: boolean = true

    protected constructor(id: string | undefined,
                          title: string,
                          icon: string,
                          component: Raw<DefineComponent<any, any, any>>,
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
