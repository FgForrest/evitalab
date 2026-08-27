/**
 * Subset of a `keydown` event needed to decide whether a keyboard shortcut may be dispatched.
 * Declared structurally so the predicate can be tested without a DOM.
 */
export interface KeyboardShortcutFilterEvent {
    readonly target?: EventTarget | null
    readonly srcElement?: EventTarget | null
    readonly ctrlKey?: boolean
    readonly metaKey?: boolean
    readonly altKey?: boolean
}

/**
 * Element tag names that consume keyboard input on their own and therefore must not be shadowed by
 * plain keyboard shortcuts.
 */
const keyboardInputTagNames: ReadonlySet<string> = new Set(['INPUT', 'SELECT', 'TEXTAREA'])

/**
 * Decides whether a `keydown` event may be dispatched to keyboard shortcut handlers. Replaces the
 * default keymaster filter, which unconditionally discards every event originating from an
 * `INPUT`/`SELECT`/`TEXTAREA` element and thus makes shortcuts unreachable from any form field.
 *
 * Events carrying `Ctrl`/`Cmd` without `Alt` are let through even from form fields, because such
 * combinations are never plain text input and are exactly the ones a user wants while the caret sits
 * in a field (e.g., submitting a filter with `Ctrl+Enter`).
 *
 * `Alt` is deliberately excluded: on Central-European keyboard layouts `AltGr` is reported as
 * `Ctrl+Alt`, and `AltGr+letter` is how characters like `@ # & { } [ ]` are typed. Letting
 * `Ctrl+Alt` through would make shortcuts intercept - and, since shortcut handlers prevent the
 * default action, swallow - ordinary character input. Bare `Alt` is excluded for the same reason
 * (`Option+letter` composes characters on macOS).
 *
 * @param event the `keydown` event being filtered
 */
export function isKeyboardShortcutDispatchable(event: KeyboardShortcutFilterEvent): boolean {
    if ((event.ctrlKey === true || event.metaKey === true) && event.altKey !== true) {
        return true
    }

    const target: EventTarget | null | undefined = event.target ?? event.srcElement
    const tagName: string | undefined = (target as { tagName?: string } | null | undefined)?.tagName
    return tagName == undefined || !keyboardInputTagNames.has(tagName)
}
