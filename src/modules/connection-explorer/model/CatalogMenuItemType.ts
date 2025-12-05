
/**
 * List of actions that can be performed on a catalog.
 */
export enum CatalogMenuItemType {
    EvitaQLConsole = 'evitaQLConsole',
    GraphQLDataAPIConsole = 'graphQLDataApiConsole',
    GraphQLSchemaAPIConsole = 'graphQLSchemaApiConsole',
    ViewSchema = 'viewSchema',
    Backup = 'backup',

    HistorySubheader = 'historySubheader',
    MutationHistoryViewer = 'mutationHistoryViewer',


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
    SwitchToMutable = 'switchToMutable',
    SwitchToImmutable = 'switchToImmutable',
    ActivateCatalog = 'activateCatalog',
    DeactivateCatalog = 'deactivateCatalog',

    CollectionsSubheader = 'collectionsSubheader',
    CreateCollection = 'createCollection',
}
