import type { List as ImmutableList } from 'immutable'
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
    readonly groups: ImmutableList<VisualisedReferenceGroup>

    constructor(referenceSchema: ReferenceSchema, groups: ImmutableList<VisualisedReferenceGroup>) {
        this.referenceSchema = referenceSchema
        this.groups = groups
    }

    statisticsCount(): number {
        if (this.referenceSchema.referencedGroupType != undefined) {
            return this.groups.size
        }
        const firstGroup: VisualisedReferenceGroup | undefined = this.groups.first()
        if (firstGroup == undefined) return 0
        return firstGroup.facets.size + firstGroup.histograms.size
    }
}

export class VisualisedReferenceGroup {
    readonly groupStatistics: VisualisedReferenceGroupStatistics
    readonly facets: ImmutableList<VisualisedFacetStatistics>
    readonly histograms: ImmutableList<VisualisedHistogramStatistics>

    constructor(
        groupStatistics: VisualisedReferenceGroupStatistics,
        facets: ImmutableList<VisualisedFacetStatistics>,
        histograms: ImmutableList<VisualisedHistogramStatistics>
    ) {
        this.groupStatistics = groupStatistics
        this.facets = facets
        this.histograms = histograms
    }
}
