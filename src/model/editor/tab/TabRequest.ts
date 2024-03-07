import { DefineComponent, Raw } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import {
    TabComponentProps
} from '@/model/editor/tab/TabComponentProps'
import { TabRequestComponentParams } from '@/model/editor/tab/TabRequestComponentParams'
import { TabRequestComponentData } from '@/model/editor/tab/TabRequestComponentData'

/**
 * Request to instantiate a new editor tab.
 */
export abstract class TabRequest<PARAMS extends TabRequestComponentParams<any>, DATA extends TabRequestComponentData<any>> {

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
