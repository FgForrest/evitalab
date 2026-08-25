# `keymap` — keyboard shortcuts (and the keymap viewer tab)

One directory serving two roles: the generic shortcut infrastructure every module binds into, **and**
the feature tab that lists all shortcuts to the user.

- **Provides:** `keymapInjectionKey` → `Keymap` (`useKeymap()`),
  `keymapViewerTabFactoryInjectionKey` → `KeymapViewerTabFactory`
- **Injects:** `tabFactoryRegistryInjectionKey`

## Contents

| Path | Purpose |
|------|---------|
| `model/Command.ts` | The `Command` enum — **every** user-facing action has an entry |
| `model/keyboardShortcutMappings.ts` | `Command` → key combination |
| `model/KeyboardShortcut.ts` | Shortcut model |
| `model/keyboardShortcutEventFilter.ts` | `isKeyboardShortcutDispatchable` — which `keydown` events may reach handlers |
| `model/SystemType.ts` | OS-dependent rendering (⌘ vs Ctrl) |
| `service/Keymap.ts` | `bind` / `unbind` / `bindGlobal`, `pushScope` / `popScope`, `prettyPrint` |
| `viewer/component/KeymapViewer.vue` | The tab listing all shortcuts |
| `viewer/workspace/` | `KeymapViewerTabDefinition`, `KeymapViewerTabFactory` (`TabType.KeymapViewer`) |

## Binding contract

Shortcuts are **scoped**, normally per tab id:

- bind in `onMounted`, unbind in `onUnmounted`, passing the tab's `props.id` as the scope
- dialog-local shortcuts use `keymap.pushScope` / `popScope` while the dialog is open
- `bindGlobal` is for shortcuts that must work regardless of the active tab

Forgetting to unbind leaks the binding into other tabs, so the paired `onMounted`/`onUnmounted` calls
belong together in review.

## Shortcuts from inside form fields

The layer is built on **keymaster**, which installs one `document`-level `keydown` listener and passes
every event through `key.filter`. Its default implementation discards any event whose
`target.tagName` is `INPUT`, `SELECT` or `TEXTAREA` — so a `keymap.bind` shortcut could never fire while
the caret sat in a `VTextField` / `VSelect` / `VCombobox` / `VDateTimeInput`. (The pre-existing
`Ctrl+Enter` in the consoles was unaffected only because CodeMirror is a `div[contenteditable]`.)

`Keymap`'s constructor replaces that filter with `isKeyboardShortcutDispatchable`, whose rule is:

> let the event through when it carries **Ctrl or Cmd without Alt**; otherwise fall back to keymaster's
> default input rejection.

**`Alt` is deliberately excluded.** On Central-European layouts **AltGr is reported as Ctrl+Alt**, and
`AltGr+letter` is how `@ # & { } [ ]` are typed; bare `Option+letter` composes characters on macOS.
Since shortcut handlers return `false` — which makes keymaster call `preventDefault()` — relaxing
`Ctrl+Alt` would let `Ctrl+Alt+K` (`System_Keymap`) and `Ctrl+Alt+PageUp/PageDown` swallow ordinary
character input. The deliberate consequence is that those two, plus `Alt+1`
(`System_Panels_Connection`), still do not fire from inside a field.

The rule is safe for everything else because no text-editing combination (`Ctrl+A/C/V/X/Z/Y`,
`Ctrl+Backspace`, `Ctrl+Arrow`, `Home`/`End`) is mapped at all, and the only modifier-less mapping —
`QueryEditor_SimplifySelection = 'Escape'` — is never keymaster-bound. **The whole `QueryEditor_*` block
exists only to populate the keymap viewer**; CodeMirror's own keymap handles those keys.

When changing this rule, note that the predicate is a pure exported function precisely so it can be
pinned by a unit test without a DOM (`test/modules/keymap/keyboardShortcutEventFilter.test.ts`).

## Every action needs a `Command`

Two conventions depend on it: icon-only buttons carry a `VActionTooltip` bound to their `command` so
the tooltip advertises the shortcut, and input placeholders embed it via
`` `Filter by (${keymap.prettyPrint(command)})` ``. A button with no `Command` gets a plain `VTooltip`
instead — but an icon button with no tooltip at all is a bug.

## Related

- [design language — keyboard first](../design-language.md#keyboard-first)
- [recipes — add a keyboard shortcut](../recipes.md)
- [`base`](base.md) — `VActionTooltip`
