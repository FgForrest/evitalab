/**
 * A representative flag ("chip") shown next to a schema item in schema-viewer lists.
 */
export class Flag
{
    readonly flag: string
    /**
     * Scope identifiers this flag applies to, always stored as raw {@link EntityScope} values
     * (e.g. `'live'`, `'archive'`) — never pre-translated mdi icon strings. The rendering component
     * (`SchemaContainerSectionListItem.vue`) is the single place that maps them to icons via
     * `EntityScopeIcons`.
     */
    readonly icons: string[]
    readonly tooltip?: string

    constructor(flag: string, icon: string[] = [], tooltip: string | undefined = undefined) {
        this.flag = flag
        this.icons = icon
        this.tooltip = tooltip
    }
}

export enum FlagType {
    Sortable = 'sortable',
    Filterable = 'filterable',
    Unique = 'unique',
    GloballyUnique = 'globallyUnique',
    Faceted = 'faceted',
    Indexed = 'indexed',
}
