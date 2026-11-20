import type { Command } from '@/modules/keymap/model/Command'

/**
 * Alternative way of executing a query, offered in the drop-down menu of `VExecuteQueryButton`.
 */
export interface ExecuteQueryVariant {
    /**
     * Command of the variant. Its keyboard shortcut is displayed in the item's tooltip and the command is emitted
     * when the item is clicked.
     */
    readonly command: Command
    /**
     * Label of the menu item.
     */
    readonly title: string
}
