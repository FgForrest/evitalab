import { inject, InjectionKey } from 'vue'
import { UnexpectedError } from '@/model/lab'
import { KeyBinding } from '@codemirror/view'
import keymaster from 'keymaster'
import { Command } from '@/model/editor/keymap/Command'
import { keyboardShortcutMappingIndex } from '@/model/editor/keymap/keyboardShortcutMappings'
import { KeyboardShortcut } from '@/model/editor/keymap/KeyboardShortcut'
import { SystemType } from '@/model/editor/keymap/SystemType'

export const key: InjectionKey<Keymap> = Symbol()

/**
 * Provides access to keyboard shortcut bindings based on current system.
 */
export class Keymap {
    private readonly systemType: SystemType

    private readonly activeContexts: Map<string, string[]> = new Map<string, string[]>()
    private activatedContextId: string | undefined = undefined

    constructor() {
        this.systemType = this.getCurrentSystemType()
    }

    /**
     * Sets the main context for keyboard shortcuts. Used to switch between different contexts to enable correct mappings.
     * Previously set context are preserved for possible reactivation until manually deleted.
     *
     * @param contextId arbitrary string identifying the context (usually tab ids)
     */
    setContext(contextId: string): void {
        this.validateContextId(contextId)

        let scopes: string[] | undefined = this.activeContexts.get(contextId)
        if (scopes == undefined) {
            scopes = []
            this.activeContexts.set(contextId, scopes)
        }

        this.activateContext(contextId)
    }

    /**
     * Deletes stored context and all its scopes. If new context is set with the same ID, it will behave like it was never
     * created before.
     *
     * @param contextId arbitrary string identifying the context (usually tab ids)
     */
    deleteContext(contextId: string): void {
        this.validateContextId(contextId)

        this.activeContexts.delete(contextId)
        if (this.activatedContextId === contextId) {
            this.resetActivatedContext()
        }
    }

    /**
     * Deactivates currently activated context and activates the global one only.
     */
    resetActivatedContext(): void {
        this.activatedContextId = undefined
        keymaster.setScope('all')
    }

    /**
     * Pushes a new scope to an existing context. Scopes are used to enable different keyboard shortcuts for different parts
     * of the same context. They can be stacked together where the last one is the activated one. But the scopes must be
     * also correctly popped to enable the previous ones using {@link popScope}.
     *
     * @param contextId arbitrary string identifying the main context (usually tab ids)
     * @param scopeId arbitrary string identifying the scope within the context
     */
    pushScope(contextId: string, scopeId: string): void {
        this.validateContextId(contextId)
        this.validateScopeId(scopeId)

        this.getScopes(contextId).push(scopeId)
        if (this.activatedContextId === contextId) {
            this.activateContext(contextId)
        }
    }

    /**
     * Pops the last pushed scope from an existing context and activates the previous.
     *
     * @param contextId arbitrary string identifying the main context (usually tab ids)
     */
    popScope(contextId: string): void {
        this.validateContextId(contextId)

        this.getScopes(contextId).pop()
        if (this.activatedContextId === contextId) {
            this.activateContext(contextId)
        }
    }

    /**
     * Returns pretty printed keyboard shortcut based on current system for specified command.
     *
     * @param command command to get pretty printed shortcut for
     */
    prettyPrint(command: Command): string {
        return this.getKeyboardShortcut(command).prettyPrint(this.systemType)
    }

    /**
     * Returns all pretty printed keyboard shortcuts based on current system.
     */
    prettyPrintAll(): Map<Command, string> {
        const prettyPrintedShortcuts: Map<Command, string> = new Map()
        for (const [command, mapping] of keyboardShortcutMappingIndex) {
            prettyPrintedShortcuts.set(command, mapping.prettyPrint(this.systemType))
        }
        return prettyPrintedShortcuts
    }

    /**
     * Binds global action to given command.
     *
     * @param command command to bind action to
     * @param action action to bind
     */
    bindGlobal(command: Command, action: () => void): void {
        this.getKeyboardShortcut(command).bindGlobal(action)
    }

    /**
     * Binds an action to a given command in the specific context. The context switching must be done by the app.
     *
     * @param command command to bind action to
     * @param contextId arbitrary string identifying the context
     * @param action action to bind
     */
    bind(command: Command, contextId: string, action: () => void): void {
        this.getKeyboardShortcut(command).bind(this.constructKeymasterScope(contextId), action)
    }

    /**
     * Binds an action to a given command in the specific context and scope. The context switching must be done by the app.
     *
     * @param command command to bind action to
     * @param contextId arbitrary string identifying the context
     * @param scopeId arbitrary string identifying the scope within the context
     * @param action action to bind
     */
    bindWithinScope(command: Command, contextId: string, scopeId: string, action: () => void): void {
        this.getKeyboardShortcut(command).bind(this.constructKeymasterScope(contextId, scopeId), action)
    }

    /**
     * Unbinds global action from given command.
     *
     * @param command command to unbind action from
     */
    unbindGlobal(command: Command): void {
        this.getKeyboardShortcut(command).unbindGlobal()
    }

    /**
     * Unbinds an action from a given command in the specific context.
     *
     * @param command command to unbind action from
     * @param contextId arbitrary string identifying the scope, must match the scope used in bind method
     */
    unbind(command: Command, contextId: string): void {
        this.getKeyboardShortcut(command).unbind(this.constructKeymasterScope(contextId))
    }

    /**
     * Unbinds an action from a given command in the specific context.
     *
     * @param command command to unbind action from
     * @param contextId arbitrary string identifying the scope, must match the scope used in bind method
     * @param scopeId arbitrary string identifying the scope within the context
     */
    unbindWithinScope(command: Command, contextId: string, scopeId: string): void {
        this.getKeyboardShortcut(command).unbind(this.constructKeymasterScope(contextId, scopeId))
    }

    /**
     * Returns a binding of an action to a given command.
     *
     * @param command command to bind action to
     * @param action action to be executed when the shortcut is pressed
     */
    bindToCodeMirror(command: Command, action: () => void): KeyBinding {
        return this.getKeyboardShortcut(command).bindToCodeMirror(action)
    }


    /**
     * Returns a shortcut mapping for a given command.
     */
    private getKeyboardShortcut(command: Command): KeyboardShortcut {
        const mapping: KeyboardShortcut | undefined = keyboardShortcutMappingIndex.get(command)
        if (mapping == undefined) {
            throw new UnexpectedError(undefined, `No shortcut mapping found for command '${command}'. This should never happen!`)
        }
        return mapping
    }

    /**
     * Resolves current system type from browser data.
     * @private
     */
    private getCurrentSystemType(): SystemType {
        let platform: string = ''
        // @ts-ignore
        platform = navigator['userAgentData']?.platform
        if (platform == undefined) {
            platform = navigator.platform
        }

        return platform.toLowerCase().indexOf('mac') > -1 ? SystemType.Mac : SystemType.PC
    }


    /**
     * Returns all scopes from an existing context. If there is not an existing context, an error is thrown.
     *
     * @param contextId arbitrary string identifying the main context (usually tab ids)
     * @private
     */
    private getScopes(contextId: string): string[] {
        const scopes: string[] | undefined = this.activeContexts.get(contextId)
        if (scopes == undefined) {
            throw new UnexpectedError(undefined, `Cannot get scopes for context '${contextId}' without setting context first!`)
        }
        return scopes
    }

    /**
     * Returns the last scope from an existing context if any specific is defined. If there is not an existing context,
     * an error is thrown.
     *
     * @param contextId arbitrary string identifying the main context (usually tab ids)
     * @private
     */
    private getCurrentScope(contextId: string): string | undefined {
        return this.getScopes(contextId).at(-1)
    }

    /**
     * Constructs a keymaster scope based on the context and scope IDs.
     *
     * @param contextId arbitrary string identifying the main context (usually tab ids)
     * @param scopeId arbitrary string identifying the scope within the context
     * @private
     */
    private constructKeymasterScope(contextId: string, scopeId?: string): string {
        if (scopeId == undefined) {
            return contextId
        }
        return `${contextId}_${scopeId}`
    }

    /**
     * Activates the context with the last scope (if present).
     *
     * @param contextId arbitrary string identifying the main context (usually tab ids)
     * @private
     */
    private activateContext(contextId: string): void {
        keymaster.setScope(this.constructKeymasterScope(contextId, this.getCurrentScope(contextId)))
        this.activatedContextId = contextId
    }

    /**
     * Validates context ID format for forbidden characters.
     *
     * @param contextId arbitrary string identifying the main context (usually tab ids)
     * @private
     */
    private validateContextId(contextId: string): void {
        if (contextId.includes('_')) {
            throw new UnexpectedError(undefined, `Context ID '${contextId}' cannot contain underscore character!`)
        }
    }

    /**
     * Validates scope ID format for forbidden characters.
     *
     * @param scopeId arbitrary string identifying the scope within a context
     * @private
     */
    private validateScopeId(scopeId: string): void {
        if (scopeId.includes('_')) {
            throw new UnexpectedError(undefined, `Scope ID '${scopeId}' cannot contain underscore character!`)
        }
    }
}

export function useKeymap(): Keymap {
    return inject(key) as Keymap
}
