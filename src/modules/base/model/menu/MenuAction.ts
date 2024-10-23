import { Command } from '@/modules/keymap/model/Command'
import { MenuItem } from './MenuItem'

/**
 * Represents a runnable menu action
 */
export class MenuAction<AT> implements MenuItem<AT> {

    readonly value: AT
    readonly title: string
    readonly prependIcon: string
    readonly command?: Command
    readonly disabled?: boolean
    /**
     * What happens when the action is selected/clicked
     */
    readonly execute: () => void

    constructor(value: AT, title: string, prependIcon: string, execute: () => void, command?: Command, disabled?: boolean) {
        this.value = value
        this.title = title
        this.prependIcon = prependIcon
        this.execute = execute
        this.command = command
        this.disabled = disabled == undefined ? false : disabled
    }

    /**
     * Returns props needed by Vuetify components
     */
    get props() {
        return {
            prependIcon: this.prependIcon,
            disabled: this.disabled
        }
    }
}
