# `keymap` — keyboard shortcuts (and the keymap viewer tab)

One directory serving two roles: the generic shortcut infrastructure every module binds into, **and**
the feature tab that lists all shortcuts to the user.

- **Provides:** `keymapInjectionKey` → `Keymap` (`useKeymap()`),
  `keymapViewerTabFactoryInjectionKey` → `KeymapViewerTabFactory`
- **Injects:** nothing

## Contents

| Path | Purpose |
|------|---------|
| `model/Command.ts` | The `Command` enum — **every** user-facing action has an entry |
| `model/keyboardShortcutMappings.ts` | `Command` → key combination |
| `model/KeyboardShortcut.ts` | Shortcut model |
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

## Every action needs a `Command`

Two conventions depend on it: icon-only buttons carry a `VActionTooltip` bound to their `command` so
the tooltip advertises the shortcut, and input placeholders embed it via
`` `Filter by (${keymap.prettyPrint(command)})` ``. A button with no `Command` gets a plain `VTooltip`
instead — but an icon button with no tooltip at all is a bug.

## Related

- [design language — keyboard first](../design-language.md#keyboard-first)
- [recipes — add a keyboard shortcut](../recipes.md)
- [`base`](base.md) — `VActionTooltip`
