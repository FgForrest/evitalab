import keymaster from 'keymaster'
import { KeyBinding } from '@codemirror/view'
import { SystemType } from '@/model/editor/keymap/SystemType'

/**
 * Represents a single mapping of keyboard shortcuts to a single named command.
 *
 * The actual shortcut is defined in custom universal format. Each part of the shortcut is separated by a plus sign. Each
 * letter is in uppercase. The following special keys can be used:
 * Shift, Ctrl, Cmd, Alt, Option, Escape, Enter, Return, Backspace, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Space,
 * Home, End, PageUp, PageDown, Tab, Delete, Insert, F1, F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12.
 */
export class KeyboardShortcut {
    // base shortcuts
    private readonly baseShortcut: string
    private readonly macShortcut?: string

    // cached pretty printed shortcuts
    private prettyPrintedShortcutsResolved: boolean = false
    private prettyPrintedBaseShortcut: string | undefined = undefined
    private prettyPrintedMacShortcut: string | undefined = undefined

    // cached converted keymaster shortcuts
    private keymasterShortcutsResolved: boolean = false
    private keymasterShortcuts: string | undefined = undefined

    // cached converted CodeMirror shortcuts
    private codeMirrorShortcutsResolved: boolean = false
    private baseCodeMirrorShortcut: string | undefined = undefined
    private macCodeMirrorShortcut: string | undefined = undefined

    constructor(baseShortcut: string, macShortcut?: string) {
        this.baseShortcut = baseShortcut
        this.macShortcut = macShortcut
    }

    /**
     * Converts the universal shortcut format to a human-readable format for specific system.
     */
    prettyPrint(systemType: SystemType): string {
        if (!this.prettyPrintedShortcutsResolved) {
            this.prettyPrintedBaseShortcut = this.prettyPrintShortcut(this.baseShortcut)
            this.prettyPrintedMacShortcut = this.macShortcut != undefined ? this.prettyPrintShortcut(this.macShortcut) : undefined

            this.prettyPrintedShortcutsResolved = true
        }

        if (systemType === SystemType.Mac && this.prettyPrintedMacShortcut != undefined) {
            return this.prettyPrintedMacShortcut
        }
        return this.prettyPrintedBaseShortcut!
    }

    /**
     * Globally binds an action (for entire app) to the shortcut.
     *
     * @param action action to be executed when the shortcut is pressed
     */
    bindGlobal(action: () => void): void {
        // 'all' scope is special scope of keymaster that is always active
        this.bind('all', action)
    }

    /**
     * Binds an action to the shortcut in the specific scope. The scope switching must be done by the app.
     *
     * @param keymasterScope arbitrary string identifying the scope
     * @param action action to be executed when the shortcut is pressed
     */
    bind(keymasterScope: string, action: () => void): void {
        if (!this.keymasterShortcutsResolved) {
            this.keymasterShortcuts = [this.baseShortcut, this.macShortcut]
                .filter(shortcut => shortcut != undefined)
                .map(shortcut => this.convertShortcutToKeymasterFormat(shortcut!))
                .join(', ')

            this.keymasterShortcutsResolved = true
        }

        keymaster(
            this.keymasterShortcuts!,
            keymasterScope,
            () => {
                action()
                // prevent default browser action
                return false
            }
        )
    }

    /**
     * Unbinds the global action from the shortcut.
     */
    unbindGlobal(): void {
        if (!this.keymasterShortcutsResolved) {
            // not bound yet, nothing to unbind
            return
        }
        keymaster.unbind(this.keymasterShortcuts!)
    }

    /**
     * Unbinds the action from the shortcut in the specific scope.
     *
     * @param keymasterScope arbitrary string identifying the scope, must match the scope used in the bind method
     */
    unbind(keymasterScope: string): void {
        if (!this.keymasterShortcutsResolved) {
            // not bound yet, nothing to unbind
            return
        }
        keymaster.unbind(this.keymasterShortcuts!, keymasterScope)
    }

    /**
     * Creates a shortcut binding for the CodeMirror.
     */
    bindToCodeMirror(action: () => void): KeyBinding {
        if (!this.codeMirrorShortcutsResolved) {
            this.baseCodeMirrorShortcut = this.convertShortcutToCodeMirrorFormat(this.baseShortcut)
            this.macCodeMirrorShortcut = this.macShortcut != undefined ? this.convertShortcutToCodeMirrorFormat(this.macShortcut) : undefined

            this.codeMirrorShortcutsResolved = true
        }

        return {
            key: this.baseCodeMirrorShortcut,
            mac: this.macCodeMirrorShortcut,
            run: () => {
                action()
                // this key is being handled by this action, don't let CodeMirror try other keys
                return true
            }
        }
    }

    /**
     * Converts a shortcut to a human-readable format.
     * @private
     */
    private prettyPrintShortcut(shortcut: string): string {
        return shortcut
            .replace('ArrowUp', '↑')
            .replace('ArrowDown', '↓')
            .replace('ArrowLeft', '←')
            .replace('ArrowRight', '→')
            .replace('Cmd', '⌘')
            .replace('Option', '⌥')
    }

    /**
     * Converts a shortcut to a format used by keymaster.
     * Check https://github.com/madrobby/keymaster?tab=readme-ov-file#supported-keys
     *
     * @private
     */
    private convertShortcutToKeymasterFormat(shortcut: string): string {
        return shortcut
            .replace('Cmd', 'command')
            .replace('ArrowUp', 'up')
            .replace('ArrowDown', 'down')
            .replace('ArrowLeft', 'left')
            .replace('ArrowRight', 'right')
            .toLowerCase()
    }

    /**
     * Converts a shortcut to a format used by CodeMirror.
     * Check https://codemirror.net/docs/ref/#commands.standardKeymap
     *
     * @private
     */
    private convertShortcutToCodeMirrorFormat(shortcut: string): string {
        return shortcut.replace('+', '-')
    }
}

