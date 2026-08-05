/**
 * Types of actions available in the context menu of a single entity grid cell.
 */
export enum EntityGridCellMenuItemType {
    CopyValue = 'copyValue',
    CopyRawValue = 'copyRawValue',
    OpenEntityHistory = 'openEntityHistory',
    /**
     * Opens the mutation history narrowed down to the container the cell's property lives in. Its title
     * and target container differ per property type, hence a single item instead of one per type.
     */
    OpenPropertyHistory = 'openPropertyHistory'
}
