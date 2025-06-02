/**
 * List of actions that can be performed on a connection.
 */
export enum ConnectionMenuItemType {
    Server = 'server',
    Tasks = 'tasks',
    TrafficRecordings = 'trafficRecordings',
    JfrRecordings = 'jfrRecordings',
    GraphQLSystemAPIConsole = 'graphQLSystemApiConsole',

    ManageSubheader = 'manageSubheader',
    Reload = 'reload',

    ModifySubheader = 'modifySubheader',
    Edit = 'edit',
    Remove = 'remove',

    CatalogsSubheader = 'catalogsSubheader',
    CreateCatalog = 'createCatalog',
    CatalogBackups = 'catalogBackups'
}
