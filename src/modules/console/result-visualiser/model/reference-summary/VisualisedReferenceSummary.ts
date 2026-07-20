import { ReferenceSchema } from '@/modules/database-driver/request-response/schema/ReferenceSchema'
import { VisualisedReferenceGroupStatistics } from './VisualisedReferenceGroupStatistics'
import { VisualisedFacetStatistics } from './VisualisedFacetStatistics'
import { VisualisedHistogramStatistics } from './VisualisedHistogramStatistics'

export class VisualisedReferenceSummary {
    readonly references: VisualisedReferenceStatistics[]

    constructor(references: VisualisedReferenceStatistics[]) {
        this.references = references
    }
}

export class VisualisedReferenceStatistics {
    readonly referenceSchema: ReferenceSchema
    readonly groups: VisualisedReferenceGroup[]

    constructor(referenceSchema: ReferenceSchema, groups: VisualisedReferenceGroup[]) {
        this.referenceSchema = referenceSchema
        this.groups = groups
    }

    statisticsCount(): number {
        if (this.referenceSchema.referencedGroupType != undefined) {
            return this.groups.length
        }
        const firstGroup = this.groups[0]
        if (firstGroup == undefined) return 0
        return firstGroup.facets.length + firstGroup.histograms.length
    }
}

export class VisualisedReferenceGroup {
    readonly groupStatistics: VisualisedReferenceGroupStatistics
    readonly facets: VisualisedFacetStatistics[]
    readonly histograms: VisualisedHistogramStatistics[]

    constructor(
        groupStatistics: VisualisedReferenceGroupStatistics,
        facets: VisualisedFacetStatistics[],
        histograms: VisualisedHistogramStatistics[]
    ) {
        this.groupStatistics = groupStatistics
        this.facets = facets
        this.histograms = histograms
    }
}
