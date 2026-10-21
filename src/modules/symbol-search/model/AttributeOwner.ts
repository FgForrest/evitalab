/**
 * Schema that owns an attribute or a sortable attribute compound. Decides which schema pointer the symbol opens.
 */
export enum AttributeOwner {
    Catalog = 'catalog',
    Entity = 'entity',
    Reference = 'reference'
}
