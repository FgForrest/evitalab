/**
 * One line of the storage breakdown legend: a category of the catalog's disk footprint, its size, and where it
 * sits in the nesting the engine's own decomposition implies.
 */
export class StorageBreakdownRow {

    readonly label: string
    /**
     * Tooltip copy saying *why the number matters* — the legend is the page's help system.
     */
    readonly description: string
    readonly bytes: bigint
    /**
     * Swatch color, matching the series color of the breakdown bar. Absent for a row that is only a sum of the
     * rows nested under it and therefore has no series of its own.
     */
    readonly color: string | undefined
    /**
     * `0` for a top-level category, `1` for a component of one, `2` for a component of that.
     */
    readonly depth: number

    constructor(
        label: string,
        description: string,
        bytes: bigint,
        color: string | undefined,
        depth: number = 0
    ) {
        this.label = label
        this.description = description
        this.bytes = bytes
        this.color = color
        this.depth = depth
    }
}
