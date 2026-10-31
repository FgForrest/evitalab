/**
 * Set of statically defined entity properties.
 */
export enum StaticEntityProperties {
    PrimaryKey = 'primaryKey',
    Version = 'version',
    ParentPrimaryKey = 'parentPrimaryKey',
    Locales = 'locales',
    PriceInnerRecordHandling = 'priceInnerRecordHandling',
    Scope = 'scope',
}

/**
 * GraphQL entity field with all locales of the entity, the counterpart of the gRPC entity's `locales`
 * ({@link StaticEntityProperties.Locales}). The GraphQL `locales` field lists only the locales requested by the query,
 * which are none unless a data locale is selected.
 */
export const allLocalesField: string = 'allLocales'
