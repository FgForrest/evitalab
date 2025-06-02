import { MenuItem } from '@/modules/base/model/menu/MenuItem'
import { MenuAction } from '@/modules/base/model/menu/MenuAction'
import { MenuSubheader } from '@/modules/base/model/menu/MenuSubheader'

/**
 * Common ancestor for creating menu items.
 */
// todo lho refactor other factories
export abstract class MenuFactory<T> {

    protected constructor() {}

    /**
     * Creates menu items for specified parameters
     */
    abstract createItems(): Promise<Map<T, MenuItem<T>>>

    protected abstract getItemTitle(itemType: T): string

    protected createMenuSubheader(
        items: Map<T, MenuItem<T>>,
        subheaderType: T
    ): void {
        items.set(
            subheaderType,
            new MenuSubheader(this.getItemTitle(subheaderType))
        )
    }

    protected createMenuAction(
        items: Map<T, MenuItem<T>>,
        actionType: T,
        prependIcon: string,
        execute: () => void,
        enabled: boolean = true
    ): void {
        const action: MenuAction<T> = new MenuAction(
            actionType,
            this.getItemTitle(actionType),
            prependIcon,
            execute,
            undefined,
            !enabled
        )
        items.set(actionType, action)
    }
}
