import type { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import { MenuSubheader } from '@/modules/base/model/menu/MenuSubheader'

/**
 * Common ancestor for creating menu items.
 */
export abstract class MenuFactory<T> {

    protected constructor() {}

    /**
     * Creates menu items for specified parameters
     */
    abstract createItems(): Promise<Map<T, MenuItem<T>>>

    protected createMenuSubheader(
        items: Map<T, MenuItem<T>>,
        subheaderType: T,
        titleBuilder: (actionType: T) => string
    ): void {
        items.set(
            subheaderType,
            new MenuSubheader(titleBuilder(subheaderType))
        )
    }

    protected createMenuAction(
        items: Map<T, MenuItem<T>>,
        actionType: T,
        prependIcon: string,
        titleBuilder: (actionType: T) => string,
        execute: () => void,
        enabled: boolean = true
    ): void {
        const action: MenuAction<T> = new MenuAction(
            actionType,
            titleBuilder(actionType),
            prependIcon,
            execute,
            undefined,
            !enabled
        )
        items.set(actionType, action)
    }
}
