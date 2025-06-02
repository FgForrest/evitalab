/**
 * List of actions that can be performed on a catalog.
 */
export enum CatalogActionType {
    EvitaQLConsole = 'evitaQLConsole',
    GraphQLDataAPIConsole = 'graphQLDataApiConsole',
    GraphQLSchemaAPIConsole = 'graphQLSchemaApiConsole',
    ViewSchema = 'viewSchema',

    TrafficSubheader = 'trafficSubheader',
    ActiveTrafficRecording = 'activeTrafficRecording',

    ManageSubheader = 'manageSubheader',
    CloseSharedSession = 'closeSharedSession',

    ModifySubheader = 'modifySubheader',
    DeleteCatalog = 'deleteCatalog',
    RenameCatalog = 'renameCatalog',
    ReplaceCatalog = 'replaceCatalog',
    SwitchCatalogToAliveState = 'switchCatalogToAliveState',

    CollectionsSubheader = 'collectionsSubheader',
    CreateCollection = 'createCollection'
}
