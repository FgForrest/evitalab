/**
 * Action the symbol search can execute on a symbol. Each one opens a tab.
 */
export enum SymbolActionType {
    CatalogPreview = 'catalogPreview',
    Schema = 'schema',
    EvitaQLConsole = 'evitaQLConsole',
    GraphQLDataConsole = 'graphQLDataConsole',
    GraphQLSchemaConsole = 'graphQLSchemaConsole',
    EntityViewer = 'entityViewer'
}
