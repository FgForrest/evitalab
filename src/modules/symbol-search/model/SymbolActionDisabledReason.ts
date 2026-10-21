/**
 * Why an action of a symbol cannot be executed right now.
 */
export enum SymbolActionDisabledReason {
    /** the catalog is deactivated */
    CatalogInactive = 'catalogInactive',
    /** the catalog is corrupted or otherwise cannot be read */
    CatalogUnusable = 'catalogUnusable',
    /** the catalog is in a state other than alive */
    CatalogNotAlive = 'catalogNotAlive',
    /** the server does not expose the GraphQL API (or its status is not known) */
    GraphQLDisabled = 'graphQLDisabled'
}
