/**
 * Facet group statistics DTO ready for visualisation
 */
export class VisualisedFacetGroupStatistics {
    readonly primaryKey?: number
    readonly title?: string
    readonly count?: number

    constructor(primaryKey?: number, title?: string, count?: number){
        this.primaryKey = primaryKey
        this.title = title
        this.count = count
    }
}
