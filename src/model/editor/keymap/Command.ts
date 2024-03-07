/**
 * Globally unique command identifier to which keyboard shortcuts and actions are mapped.
 */
export enum Command {
    // system

    System_Keymap = 'system.keymap',

    System_Panels_ConnectionsExplorer = 'system.panels.connectionsExplorer',

    System_Editor_PreviousTab = 'system.editor.previousTab',
    System_Editor_NextTab = 'system.editor.nextTab',
    System_Editor_CloseTab = 'system.editor.closeTab',
    System_Editor_CloseAllTabs = 'system.editor.closeAllTabs',

    // query editor

    QueryEditor_MoveLineUp = 'queryEditor.moveLineUp',
    QueryEditor_MoveLineDown = 'queryEditor.moveLineDown',
    QueryEditor_CopyLineUp = 'queryEditor.copyLineUp',
    QueryEditor_CopyLineDown = 'queryEditor.copyLineDown',
    QueryEditor_SimplifySelection = 'queryEditor.simplifySelection',
    QueryEditor_SelectLine = 'queryEditor.selectLine',
    QueryEditor_SelectParentSyntax = 'queryEditor.selectParentSyntax',
    QueryEditor_IndentLess = 'queryEditor.indentLess',
    QueryEditor_IndentMore = 'queryEditor.indentMore',
    QueryEditor_IndentSelection = 'queryEditor.indentSelection',
    QueryEditor_DeleteLine = 'queryEditor.deleteLine',
    QueryEditor_CursorMatchingBracket = 'queryEditor.cursorMatchingBracket',
    QueryEditor_ToggleComment = 'queryEditor.toggleComment',
    QueryEditor_ToggleBlockComment = 'queryEditor.toggleBlockComment',

    // inline query editor

    InlineQueryEditor_OpenHistory = 'inlineQueryEditor.openHistory',

    // entity grid

    EntityGrid_ExecuteQuery = 'entityGrid.executeQuery',

    EntityGrid_ChangeQueryLanguage = 'entityGrid.changeQueryLanguage',
    EntityGrid_FocusFilterInput = 'entityGrid.focusFilterInput',
    EntityGrid_FocusOrderInput = 'entityGrid.focusOrderInput',
    EntityGrid_ChangeDataLocale = 'entityGrid.changeDataLocale',
    EntityGrid_ChangePriceType = 'entityGrid.changePriceType',
    EntityGrid_ShareTab = 'entityGrid.shareTab',

    EntityGrid_OpenPropertySelector = 'entityGrid.openPropertySelector',
    EntityGrid_PropertySelector_FindProperty = 'entityGrid.propertySelector.findProperty',

    // evitaQL console

    EvitaQLConsole_ExecuteQuery = 'evitaQLConsole.executeQuery',
    EvitaQLConsole_ShareTab = 'evitaQLConsole.shareTab',

    EvitaQLConsole_Query_SwitchToQueryEditor = 'evitaQLConsole.query.switchToQueryEditor',
    EvitaQLConsole_Query_SwitchToVariablesEditor = 'evitaQLConsole.query.switchToVariablesEditor',
    EvitaQLConsole_Query_SwitchToHistory = 'evitaQLConsole.query.switchToHistory',

    EvitaQLConsole_Result_SwitchToRawResultViewer = 'evitaQLConsole.result.switchToRawResultViewer',
    EvitaQLConsole_Result_SwitchToResultVisualizer = 'evitaQLConsole.result.switchToResultVisualizer',

    // GraphQL console

    GraphQLConsole_ExecuteQuery = 'graphQLConsole.executeQuery',
    GraphQLConsole_ShareTab = 'graphQLConsole.shareTab',

    GraphQLConsole_Query_SwitchToQueryEditor = 'graphQLConsole.query.switchToQueryEditor',
    GraphQLConsole_Query_SwitchToVariablesEditor = 'graphQLConsole.query.switchToVariablesEditor',
    GraphQLConsole_Query_SwitchToHistory = 'graphQLConsole.query.switchToHistory',
    GraphQLConsole_Query_SwitchToSchemaViewer = 'graphQLConsole.query.switchToSchemaViewer',

    GraphQLConsole_Result_SwitchToRawResultViewer = 'graphQLConsole.result.switchToRawResultViewer',
    GraphQLConsole_Result_SwitchToResultVisualizer = 'graphQLConsole.result.switchToResultVisualizer',

    // Schema viewer

    SchemaViewer_ShareTab = 'schemaViewer.shareTab'
}
