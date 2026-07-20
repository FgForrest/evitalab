import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { VisualisedFacetGroupStatistics } from './VisualisedFacetGroupStatistics'
import { VisualisedFacetStatistics } from './VisualisedFacetStatistics'

/**
 * Fully resolved facet summary DTO ready for visualisation.
 * Contains all references with their pre-resolved groups and facets.
 */
export class VisualisedFacetSummary {
    readonly references: VisualisedReferenceFacets[]

    constructor(references: VisualisedReferenceFacets[]) {
        this.references = references
    }
}

/**
 * All facet groups and facets for a single reference within the facet summary.
 */
export class VisualisedReferenceFacets {
    readonly referenceSchema: ReferenceSchema
    readonly groups: VisualisedFacetGroup[]

    constructor(referenceSchema: ReferenceSchema, groups: VisualisedFacetGroup[]) {
        this.referenceSchema = referenceSchema
        this.groups = groups
    }

    /**
     * Returns the display count for this reference: number of groups if grouped, number of facets otherwise.
     */
    facetCount(): number {
        if (this.referenceSchema.referencedGroupType != undefined) {
            return this.groups.length
        }
        const firstGroup = this.groups[0]
        return firstGroup != undefined ? firstGroup.facets.length : 0
    }
}

/**
 * A single facet group containing resolved group statistics and its facets.
 */
export class VisualisedFacetGroup {
    readonly groupStatistics: VisualisedFacetGroupStatistics
    readonly facets: VisualisedFacetStatistics[]

    constructor(
        groupStatistics: VisualisedFacetGroupStatistics,
        facets: VisualisedFacetStatistics[]
    ) {
        this.groupStatistics = groupStatistics
        this.facets = facets
    }
}
