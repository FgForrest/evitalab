/**
 * List of actions that can be performed on a catalog.
 */
export enum CatalogMenuItemType {
    EvitaQLConsole = 'evitaQLConsole',
    GraphQLDataAPIConsole = 'graphQLDataApiConsole',
    GraphQLSchemaAPIConsole = 'graphQLSchemaApiConsole',
    ViewSchema = 'viewSchema',
    Backup = 'backup',

    TrafficSubheader = 'trafficSubheader',
    ActiveTrafficRecording = 'activeTrafficRecording',

    ManageSubheader = 'manageSubheader',
    CloseSharedSession = 'closeSharedSession',

    ModifySubheader = 'modifySubheader',
    DeleteCatalog = 'deleteCatalog',
    RenameCatalog = 'renameCatalog',
    DuplicateCatalog = 'duplicateCatalog',
    ReplaceCatalog = 'replaceCatalog',
    SwitchCatalogToAliveState = 'switchCatalogToAliveState',

    CollectionsSubheader = 'collectionsSubheader',
    CreateCollection = 'createCollection'
}
