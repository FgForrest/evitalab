import { Entity } from './Entity'
import { EntityReference } from './EntityReference'
import { List, Map } from 'immutable'
import { FacetStatistics } from './FacetStatistics'
import { Histogram } from './Histogram'

export class ReferenceGroupStatistics {
    readonly referenceName: string
    readonly groupEntityReference: EntityReference | undefined
    readonly groupEntity: Entity | undefined
    readonly count: number
    readonly facetStatistics: List<FacetStatistics>
    readonly histogramStatistics: Map<string, Histogram>

    constructor(referenceName: string,
                count: number,
                facetStatistics: List<FacetStatistics>,
                groupEntityReference: EntityReference | undefined,
                groupEntity: Entity | undefined,
                histogramStatistics: Map<string, Histogram>){
        this.referenceName = referenceName
        this.count = count
        this.facetStatistics = facetStatistics
        this.groupEntityReference = groupEntityReference
        this.groupEntity = groupEntity
        this.histogramStatistics = histogramStatistics
    }
}
