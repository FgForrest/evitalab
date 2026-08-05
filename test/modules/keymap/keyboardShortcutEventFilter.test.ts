import { describe, test, expect } from 'vitest'
import {
    isKeyboardShortcutDispatchable
} from '../../../src/modules/keymap/model/keyboardShortcutEventFilter'

function event(
    tagName: string | undefined,
    modifiers: { ctrlKey?: boolean, metaKey?: boolean, altKey?: boolean } = {}
) {
    return {
        target: tagName == undefined ? null : { tagName },
        ...modifiers
    } as never
}

describe('isKeyboardShortcutDispatchable', () => {

    test('lets everything through outside of keyboard input elements', () => {
        expect(isKeyboardShortcutDispatchable(event('DIV'))).toBe(true)
        expect(isKeyboardShortcutDispatchable(event('BODY', { altKey: true }))).toBe(true)
        expect(isKeyboardShortcutDispatchable(event(undefined))).toBe(true)
    })

    test.each(['INPUT', 'SELECT', 'TEXTAREA'])('blocks unmodified keys in %s', (tagName) => {
        expect(isKeyboardShortcutDispatchable(event(tagName))).toBe(false)
    })

    test.each(['INPUT', 'SELECT', 'TEXTAREA'])('lets Ctrl and Cmd through from %s', (tagName) => {
        expect(isKeyboardShortcutDispatchable(event(tagName, { ctrlKey: true }))).toBe(true)
        expect(isKeyboardShortcutDispatchable(event(tagName, { metaKey: true }))).toBe(true)
    })

    test('blocks Alt combinations in keyboard input elements so AltGr keeps composing characters', () => {
        expect(isKeyboardShortcutDispatchable(event('INPUT', { ctrlKey: true, altKey: true }))).toBe(false)
        expect(isKeyboardShortcutDispatchable(event('INPUT', { metaKey: true, altKey: true }))).toBe(false)
        expect(isKeyboardShortcutDispatchable(event('INPUT', { altKey: true }))).toBe(false)
    })

    test('falls back to srcElement when target is missing', () => {
        expect(isKeyboardShortcutDispatchable({ srcElement: { tagName: 'INPUT' } } as never)).toBe(false)
        expect(isKeyboardShortcutDispatchable({ srcElement: { tagName: 'DIV' } } as never)).toBe(true)
    })
})
