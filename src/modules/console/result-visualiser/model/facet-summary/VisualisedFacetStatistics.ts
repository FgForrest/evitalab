/**
 * Facet statistics DTO ready for visualisation
 */
export class VisualisedFacetStatistics {
    readonly requested?: boolean
    readonly primaryKey?: number
    readonly title?: string
    readonly numberOfEntities?: number
    readonly impactDifference?: string
    readonly impactMatchCount?: number
    readonly count?: number

    constructor(requested?: boolean, primaryKey?: number, title?: string, numberOfEntities?: number, impactDifference?: string, impactMatchCount?: number, count?: number) {
        this.requested = requested
        this.primaryKey = primaryKey
        this.title = title
        this.numberOfEntities = numberOfEntities
        this.impactDifference = impactDifference
        this.impactMatchCount = impactMatchCount
        this.count = count
    }
}
