/**
 * Kind of a schema item that can be found by the symbol search. The declaration order is the order in which
 * the types are listed in the search results.
 */
export enum SymbolType {
    Catalog = 'catalog',
    EntityCollection = 'entityCollection',
    Attribute = 'attribute',
    SortableAttributeCompound = 'sortableAttributeCompound',
    AssociatedData = 'associatedData',
    Reference = 'reference'
}

const symbolTypeOrder: SymbolType[] = Object.values(SymbolType)

/**
 * Returns the position of the type in the search results, lower comes first.
 */
export function symbolTypeSortRank(type: SymbolType): number {
    return symbolTypeOrder.indexOf(type)
}
