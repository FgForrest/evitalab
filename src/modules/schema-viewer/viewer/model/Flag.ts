export class Flag
{
    readonly flag: string
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
