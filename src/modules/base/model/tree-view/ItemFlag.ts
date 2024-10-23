import { ItemFlagType } from '@/modules/base/model/tree-view/ItemFlagType'

/**
 * Represents a single flag on tree-view item
 */
export class ItemFlag {
    readonly value: string
    readonly type: ItemFlagType;

    private constructor(value: string, type: ItemFlagType) {
        this.value = value
        this.type = type
    }

    static info(value: string): ItemFlag {
        return new ItemFlag(value, ItemFlagType.Info)
    }

    static warning(value: string): ItemFlag {
        return new ItemFlag(value, ItemFlagType.Warning)
    }

    static error(value: string): ItemFlag {
        return new ItemFlag(value, ItemFlagType.Error)
    }
}
