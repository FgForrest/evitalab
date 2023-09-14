import { v4 as uuidv4 } from 'uuid';
import { DefineComponent } from 'vue/dist/vue'
import { Raw } from 'vue'

/**
 * Request to instantiate a new editor tab.
 */
export abstract class TabRequest<PARAMS extends TabRequestComponentParams, DATA extends TabRequestComponentData> {
    readonly id: string;
    readonly title: string;
    readonly icon: string;
    readonly component: Raw<DefineComponent<any, any, any>>
    readonly params: PARAMS
    readonly initialData: DATA | undefined

    /**
     * Indicates whether this tab has been visited by the user or not.
     */
    new: boolean = true

    protected constructor(title: string,
                          icon: string,
                          component: Raw<DefineComponent<any, any, any>>,
                          params: PARAMS,
                          initialData: DATA | undefined = undefined) {
        this.id = uuidv4()
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
            params: this.params,
            data: this.initialData
        }
    }
}

/**
 * Props of a component to be instantiated inside a tab. It is dynamically created from passed {@link TabRequestComponentParams}
 * and {@link TabRequestComponentData}.
 */
export type TabComponentProps<P extends TabRequestComponentParams, D extends TabRequestComponentData> = {
    readonly params: P
    readonly data: D | undefined
}

/**
 * Interface that is supposed to represent props of a component that is used to render inside a tab.
 */
export interface TabRequestComponentParams {}

/**
 * Represents injectable/storable data of a component. This is used to pre-fill the component with
 * valid user data. This can be used, e.g., to pre-fill a query editor with a query, so it can be executed right away.
 * Also, the component should provide updated data when user changes them, so they can be stored for later
 * reconstruction of tabs.
 */
export interface TabRequestComponentData {}

/**
 * Marks a tab request as executable. This means that user data in that tab can be executed, e.g., a query can be executed.
 */
export interface ExecutableTabRequest extends TabRequestComponentParams {
    /**
     * Indicates whether the tab should be executed automatically when it is opened. Usually, some initial user data
     * should be passed.
     */
    readonly executeOnOpen: boolean
}

/**
 * Represents injectable/storable data of a component that doesn't support any user data.
 */
export interface VoidTabRequestComponentData extends TabRequestComponentData {}
