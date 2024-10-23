/**
 * Defines uniqueness of global attribute's value
 */
export enum GlobalAttributeUniquenessType {
    /**
     * The attribute is not unique (default).
     */
    NotUnique = 'notUnique',
    /**
     * The attribute value (either localized or non-localized) must be unique among all values among all the entities
     * using this {@link GlobalAttributeSchema} in the entire catalog.
     */
    UniqueWithinCatalog = 'uniqueWithinCatalog',
    /**
     * The localized attribute value must be unique among all values of the same locale among all the entities
     * using this {@link GlobalAttributeSchema} in the entire catalog.
     */
    UniqueWithinCatalogLocale = 'uniqueWithinCatalogLocale'
}
