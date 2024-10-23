import { Command } from '@/modules/keymap/model/Command'
import { KeyboardShortcut } from '@/modules/keymap/model/KeyboardShortcut'

const keyboardShortcutMappingIndex: Map<Command, KeyboardShortcut> = new Map()
function createKeyboardShortcutMapping(command: Command, baseShortcut: string, macShortcut?: string): void {
    keyboardShortcutMappingIndex.set(command, new KeyboardShortcut(baseShortcut, macShortcut))
}

// system

createKeyboardShortcutMapping(Command.System_Keymap, 'Ctrl+Alt+K', 'Cmd+Option+K')

createKeyboardShortcutMapping(Command.System_Panels_ConnectionsExplorer, 'Alt+1', 'Ctrl+Shift+1')

createKeyboardShortcutMapping(Command.System_Editor_PreviousTab, 'Ctrl+Alt+PageUp', 'Cmd+Option+PageUp')
createKeyboardShortcutMapping(Command.System_Editor_NextTab, 'Ctrl+Alt+PageDown', 'Cmd+Option+PageDown')
createKeyboardShortcutMapping(Command.System_Editor_CloseTab, 'Ctrl+Q', 'Cmd+E')
createKeyboardShortcutMapping(Command.System_Editor_CloseAllTabs, 'Ctrl+Shift+Q', 'Cmd+Shift+E')

// query editor

createKeyboardShortcutMapping(Command.QueryEditor_MoveLineUp, 'Alt+ArrowUp')
createKeyboardShortcutMapping(Command.QueryEditor_MoveLineDown, 'Alt+ArrowDown')
createKeyboardShortcutMapping(Command.QueryEditor_CopyLineUp, 'Shift+Alt+ArrowUp')
createKeyboardShortcutMapping(Command.QueryEditor_CopyLineDown, 'Shift+Alt+ArrowDown')
createKeyboardShortcutMapping(Command.QueryEditor_SimplifySelection, 'Escape')
createKeyboardShortcutMapping(Command.QueryEditor_SelectLine, 'Alt+l', 'Ctrl+l')
createKeyboardShortcutMapping(Command.QueryEditor_SelectParentSyntax, 'Ctrl+i', 'Cmd+i')
createKeyboardShortcutMapping(Command.QueryEditor_IndentLess, 'Ctrl+[', 'Cmd+[')
createKeyboardShortcutMapping(Command.QueryEditor_IndentMore, 'Ctrl+]', 'Cmd+]')
createKeyboardShortcutMapping(Command.QueryEditor_IndentSelection, 'Ctrl+Alt+\\', 'Cmd+Alt+\\')
createKeyboardShortcutMapping(Command.QueryEditor_DeleteLine, 'Shift+Del', 'Shift+Del')
createKeyboardShortcutMapping(Command.QueryEditor_CursorMatchingBracket, 'Shift+Ctrl+\\', 'Shift+Cmd+\\')
createKeyboardShortcutMapping(Command.QueryEditor_ToggleComment, 'Ctrl+/', 'Cmd+/')
createKeyboardShortcutMapping(Command.QueryEditor_ToggleBlockComment, 'Shift+Alt+a')

// inline query editor

createKeyboardShortcutMapping(Command.InlineQueryEditor_OpenHistory, 'Alt+ArrowDown', 'Cmd+ArrowDown')

// entity grid

createKeyboardShortcutMapping(Command.EntityViewer_ExecuteQuery, 'Ctrl+Enter', 'Cmd+Enter')
createKeyboardShortcutMapping(Command.EntityViewer_ShareTab, 'Ctrl+L', 'Cmd+L')

createKeyboardShortcutMapping(Command.EntityViewer_ChangeQueryLanguage, 'Ctrl+D', 'Cmd+D')
createKeyboardShortcutMapping(Command.EntityViewer_FilterBy, 'Ctrl+F', 'Cmd+F')
createKeyboardShortcutMapping(Command.EntityViewer_OrderBy, 'Ctrl+G', 'Cmd+G')
createKeyboardShortcutMapping(Command.EntityViewer_ChangeDataLocale, 'Ctrl+H', 'Cmd+U')
createKeyboardShortcutMapping(Command.EntityViewer_ChangePriceType, 'Ctrl+J', 'Cmd+I')
createKeyboardShortcutMapping(Command.EntityViewer_OpenPropertySelector, 'Ctrl+P', 'Cmd+P')

createKeyboardShortcutMapping(Command.EntityViewer_PropertySelector_FindProperty, 'Ctrl+F', 'Cmd+F')

// evitaQL console

createKeyboardShortcutMapping(Command.EvitaQLConsole_ExecuteQuery, 'Ctrl+Enter', 'Cmd+Enter')
createKeyboardShortcutMapping(Command.EvitaQLConsole_ShareTab, 'Ctrl+L', 'Cmd+L')

createKeyboardShortcutMapping(Command.EvitaQLConsole_Query_QueryEditor, 'Ctrl+1', 'Ctrl+1')
createKeyboardShortcutMapping(Command.EvitaQLConsole_Query_VariablesEditor, 'Ctrl+2', 'Ctrl+2')
createKeyboardShortcutMapping(Command.EvitaQLConsole_Query_History, 'Ctrl+3', 'Ctrl+3')

createKeyboardShortcutMapping(Command.EvitaQLConsole_Result_RawResultViewer, 'Ctrl+0', 'Ctrl+0')
createKeyboardShortcutMapping(Command.EvitaQLConsole_Result_ResultVisualizer, 'Ctrl+9', 'Ctrl+9')

// GraphQL console

createKeyboardShortcutMapping(Command.GraphQLConsole_ExecuteQuery, 'Ctrl+Enter', 'Cmd+Enter')
createKeyboardShortcutMapping(Command.GraphQLConsole_ShareTab, 'Ctrl+L', 'Cmd+L')

createKeyboardShortcutMapping(Command.GraphQLConsole_Query_QueryEditor, 'Ctrl+1', 'Ctrl+1')
createKeyboardShortcutMapping(Command.GraphQLConsole_Query_VariablesEditor, 'Ctrl+2', 'Ctrl+2')
createKeyboardShortcutMapping(Command.GraphQLConsole_Query_History, 'Ctrl+3', 'Ctrl+3')
createKeyboardShortcutMapping(Command.GraphQLConsole_Query_SchemaViewer, 'Ctrl+4', 'Ctrl+4')

createKeyboardShortcutMapping(Command.GraphQLConsole_Result_RawResultViewer, 'Ctrl+0', 'Ctrl+0')
createKeyboardShortcutMapping(Command.GraphQLConsole_Result_ResultVisualizer, 'Ctrl+9', 'Ctrl+9')

// Schema viewer

createKeyboardShortcutMapping(Command.SchemaViewer_ShareTab, 'Ctrl+L', 'Cmd+L')

export { keyboardShortcutMappingIndex }
