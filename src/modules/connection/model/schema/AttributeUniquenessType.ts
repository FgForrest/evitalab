/**
 * Defines uniqueness of attribute's value
 */
export enum AttributeUniquenessType {
    /**
     * The attribute is not unique (default).
     */
    NotUnique = 'notUnique',
    /**
     * The attribute value must be unique among all the entities of the same collection.
     */
    UniqueWithinCollection = 'uniqueWithinCollection',
    /**
     * The localized attribute value must be unique among all values of the same locale among all the entities
     * using of the same collection.
     */
    UniqueWithinCollectionLocale = 'uniqueWithinCollectionLocale'
}
