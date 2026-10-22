import { SymbolType } from '@/modules/symbol-search/model/SymbolType'
import { SymbolActionType } from '@/modules/symbol-search/model/SymbolActionType'

/**
 * Actions offered for each symbol type, in the order they are rendered. The first enabled one is the default.
 */
export const symbolActions: ReadonlyMap<SymbolType, readonly SymbolActionType[]> = new Map<SymbolType, SymbolActionType[]>([
    [
        SymbolType.Catalog,
        [
            SymbolActionType.CatalogPreview,
            SymbolActionType.Schema,
            SymbolActionType.EvitaQLConsole,
            SymbolActionType.GraphQLDataConsole,
            SymbolActionType.GraphQLSchemaConsole
        ]
    ],
    [SymbolType.EntityCollection, [SymbolActionType.EntityViewer, SymbolActionType.Schema]],
    [SymbolType.Attribute, [SymbolActionType.Schema]],
    [SymbolType.SortableAttributeCompound, [SymbolActionType.Schema]],
    [SymbolType.AssociatedData, [SymbolActionType.Schema]],
    [SymbolType.Reference, [SymbolActionType.Schema]]
])

/**
 * Returns the actions of a symbol type.
 */
export function symbolActionsOf(type: SymbolType): readonly SymbolActionType[] {
    return symbolActions.get(type) ?? []
}
