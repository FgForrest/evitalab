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

    EntityViewer_ExecuteQuery = 'entityViewer.executeQuery',

    EntityViewer_ChangeQueryLanguage = 'entityViewer.changeQueryLanguage',
    EntityViewer_FilterBy = 'entityViewer.filterBy',
    EntityViewer_OrderBy = 'entityViewer.orderBy',
    EntityViewer_ChangeDataLocale = 'entityViewer.changeDataLocale',
    EntityViewer_ChangePriceType = 'entityViewer.changePriceType',
    EntityViewer_ShareTab = 'entityViewer.shareTab',

    EntityViewer_OpenPropertySelector = 'entityViewer.openPropertySelector',
    EntityViewer_PropertySelector_FindProperty = 'entityViewer.propertySelector.findProperty',

    // evitaQL console

    EvitaQLConsole_ExecuteQuery = 'evitaQLConsole.executeQuery',
    EvitaQLConsole_ShareTab = 'evitaQLConsole.shareTab',

    EvitaQLConsole_Query_QueryEditor = 'evitaQLConsole.query.queryEditor',
    EvitaQLConsole_Query_VariablesEditor = 'evitaQLConsole.query.variablesEditor',
    EvitaQLConsole_Query_History = 'evitaQLConsole.query.history',

    EvitaQLConsole_Result_RawResultViewer = 'evitaQLConsole.result.rawResultViewer',
    EvitaQLConsole_Result_ResultVisualizer = 'evitaQLConsole.result.resultVisualizer',

    // GraphQL console

    GraphQLConsole_ExecuteQuery = 'graphQLConsole.executeQuery',
    GraphQLConsole_ShareTab = 'graphQLConsole.shareTab',

    GraphQLConsole_Query_QueryEditor = 'graphQLConsole.query.queryEditor',
    GraphQLConsole_Query_VariablesEditor = 'graphQLConsole.query.variablesEditor',
    GraphQLConsole_Query_History = 'graphQLConsole.query.history',
    GraphQLConsole_Query_SchemaViewer = 'graphQLConsole.query.schemaViewer',

    GraphQLConsole_Result_RawResultViewer = 'graphQLConsole.result.rawResultViewer',
    GraphQLConsole_Result_ResultVisualizer = 'graphQLConsole.result.resultVisualizer',

    // Schema viewer

    SchemaViewer_ShareTab = 'schemaViewer.shareTab',

    // Traffic record history viewer

    TrafficRecordHistoryViewer_ShareTab = 'trafficRecordHistoryViewer.shareTab',
    TrafficRecordHistoryViewer_ReloadRecordHistory = 'trafficRecordHistoryViewer.reloadRecordHistory',
    TrafficRecordHistoryViewer_MoveStartPointer = 'trafficRecordHistoryViewer.moveStartPointer'
}
