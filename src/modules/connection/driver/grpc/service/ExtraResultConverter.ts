import { ExtraResults } from '@/modules/connection/model/data/ExtraResults'
import {
    GrpcExtraResults,
    GrpcFacetGroupStatistics,
    GrpcFacetStatistics,
    GrpcHierarchy,
    GrpcHistogram,
    GrpcHistogram_GrpcBucket,
    GrpcLevelInfo,
    GrpcLevelInfos,
} from '../gen/GrpcExtraResults_pb'
import { Histogram } from '@/modules/connection/model/data/Histogram'
import { Value } from '@/modules/connection/model/Value'
import Immutable, { List } from 'immutable'
import { HistogramBucket } from '@/modules/connection/model/data/HistogramBucket'
import { BigDecimal } from '@/modules/connection/model/data-type/BigDecimal'
import { FacetGroupStatistics } from '@/modules/connection/model/data/FacetGroupStatistics'
import { FacetStatistics } from '@/modules/connection/model/data/FacetStatistics'
import { EntityConverter } from './EntityConverter'
import { GrpcEntityReference } from '../gen/GrpcEntity_pb'
import { EntityReference } from '@/modules/connection/model/data/EntityReference'
import { Hierarchy } from '@/modules/connection/model/data/Hierarchy'
import { LevelInfo } from '@/modules/connection/model/data/LevelInfo'

export class ExtraResultConverter {
    private readonly entityConverter: EntityConverter

    constructor(entityConverter: EntityConverter){
        this.entityConverter = entityConverter
    }

    convert(entity: GrpcExtraResults | undefined): ExtraResults | undefined {
        if(!entity)
            return undefined
        return new ExtraResults(
            Value.of(this.convertAttributeHistogram(entity.attributeHistogram)),
            Value.of(
                this.convertFacetGroupStatistics(entity.facetGroupStatistics)
            ),
            Value.of(this.convertHierarchy(entity.hierarchy)),
            Value.of(this.convertHistogram(entity.priceHistogram)),
            Value.of(this.convertSelfHierarchy(entity.selfHierarchy))
        )
    }

    convertAttributeHistogram(histograms: {
        [key: string]: GrpcHistogram
    }): Immutable.Map<string, Histogram> | undefined {
        const newHistograms = new Map<string, Histogram>()
        for (const histogramName in histograms) {
            const histogram = histograms[histogramName]
            newHistograms.set(
                histogramName,
                new Histogram(
                    Value.of(histogram.overallCount),
                    Value.of(this.convertHistogramBuckets(histogram.buckets)),
                    Value.of(new BigDecimal(histogram.min?.valueString!)),
                    Value.of(new BigDecimal(histogram.max?.valueString!))
                )
            )
        }
        return newHistograms.size === 0 ? undefined : Immutable.Map(newHistograms)
    }

    convertHistogramBuckets(
        buckets: GrpcHistogram_GrpcBucket[]
    ): List<HistogramBucket> {
        const newBuckets: HistogramBucket[] = []
        for (const bucket of buckets) {
            newBuckets.push(
                new HistogramBucket(
                    Value.of(bucket.occurrences),
                    Value.of(bucket.requested),
                    Value.of(new BigDecimal(bucket.threshold?.valueString!))
                )
            )
        }
        return List(newBuckets)
    }

    convertFacetGroupStatistics(
        facetGroupStatistics: GrpcFacetGroupStatistics[]
    ): Immutable.List<FacetGroupStatistics> | undefined {
        const newFacetGroupStatistics: FacetGroupStatistics[] = []
        for (const facetGroupStatistic of facetGroupStatistics) {
            newFacetGroupStatistics.push(
                new FacetGroupStatistics(
                    facetGroupStatistic.referenceName,
                    Value.of(facetGroupStatistic.count),
                    Value.of(
                        this.convertFacetStatistics(
                            facetGroupStatistic.facetStatistics
                        )
                    ),
                    Value.of(
                        this.convertEntityReference(
                            facetGroupStatistic.groupEntityReference
                        )
                    ),
                    Value.of(
                        facetGroupStatistic.groupEntity
                            ? this.entityConverter.convert(
                                  facetGroupStatistic.groupEntity
                              )
                            : undefined
                    )
                )
            )
        }
        return newFacetGroupStatistics.length === 0 ? undefined : Immutable.List(newFacetGroupStatistics)
    }

    convertFacetStatistics(
        facetStatistics: GrpcFacetStatistics[]
    ): Immutable.List<FacetStatistics> {
        const newFacetStatistics: FacetStatistics[] = []
        for (const facetStatistic of facetStatistics) {
            newFacetStatistics.push(
                new FacetStatistics(
                    Value.of(facetStatistic.requested),
                    Value.of(facetStatistic.count),
                    Value.of(facetStatistic.hasSense),
                    Value.of(
                        facetStatistic.facetEntity
                            ? this.entityConverter.convert(
                                  facetStatistic.facetEntity
                              )
                            : undefined
                    ),
                    Value.of(facetStatistic.impact),
                    Value.of(facetStatistic.matchCount),
                    Value.of(
                        this.convertEntityReference(
                            facetStatistic.facetEntityReference
                        )
                    )
                )
            )
        }
        return Immutable.List(newFacetStatistics)
    }

    convertEntityReference(
        entityReference: GrpcEntityReference | undefined
    ): EntityReference | undefined {
        if (entityReference) {
            return new EntityReference(
                entityReference.entityType,
                entityReference.primaryKey,
                entityReference.version
            )
        } else {
            return undefined
        }
    }

    convertGroupEntityReference(
        facetGroupEntityReference: GrpcEntityReference | undefined
    ) {
        if (facetGroupEntityReference) {
            return new EntityReference(
                facetGroupEntityReference.entityType,
                facetGroupEntityReference.primaryKey,
                facetGroupEntityReference.version
            )
        } else {
            return undefined
        }
    }

    convertSelfHierarchy(
        hierarchy: GrpcHierarchy | undefined
    ): Hierarchy | undefined {
        if (hierarchy) return this.convertHierarchyAttribute(hierarchy)
        else return undefined
    }

    convertHierarchy(hierarchy: {
        [key: string]: GrpcHierarchy
    }): Immutable.Map<string, Hierarchy> | undefined {
        const newHierarchy: Map<string, Hierarchy> = new Map<
            string,
            Hierarchy
        >()
        for (const hierarchyName in hierarchy) {
            const newHierarchyData = this.convertHierarchyAttribute(
                hierarchy[hierarchyName]
            )
            newHierarchy.set(hierarchyName, newHierarchyData)
        }
        return newHierarchy.size === 0 ? undefined : Immutable.Map(newHierarchy)
    }

    convertHierarchyAttribute(hierarchy: GrpcHierarchy): Hierarchy {
        const levelInfos: Map<string, List<LevelInfo>> = new Map()
        const hierarchyData = hierarchy.hierarchy
        for (const levelInfoName in hierarchyData) {
            levelInfos.set(
                levelInfoName,
                this.convertLevelInfos(hierarchyData[levelInfoName])
            )
        }
        return new Hierarchy(Value.of(Immutable.Map(levelInfos)))
    }

    convertLevelInfos(levelInfos: GrpcLevelInfos): List<LevelInfo> {
        const newLevelInfos: LevelInfo[] = []
        for (const levelInfo of levelInfos.levelInfos) {
            newLevelInfos.push(
                new LevelInfo(
                    Value.of(this.convertLevelInfo(levelInfo.items)),
                    Value.of(levelInfo.requested),
                    Value.of(levelInfo.childrenCount),
                    Value.of(levelInfo.queriedEntityCount),
                    Value.of(
                        levelInfo.entity
                            ? this.entityConverter.convert(levelInfo.entity)
                            : undefined
                    ),
                    Value.of(
                        this.convertEntityReference(levelInfo.entityReference)
                    )
                )
            )
        }
        return Immutable.List(newLevelInfos)
    }

    convertLevelInfo(levelInfo: GrpcLevelInfo[]): Immutable.List<LevelInfo> {
        const levelInfos: LevelInfo[] = []
        for (const info of levelInfo) {
            levelInfos.push(
                new LevelInfo(
                    Value.of(this.convertLevelInfo(info.items)),
                    Value.of(info.requested),
                    Value.of(info.childrenCount),
                    Value.of(info.queriedEntityCount),
                    Value.of(
                        info.entity
                            ? this.entityConverter.convert(info.entity)
                            : undefined
                    ),
                    Value.of(this.convertEntityReference(info.entityReference))
                )
            )
        }
        return Immutable.List(levelInfos)
    }

    convertHistogram(histogram: GrpcHistogram | undefined): Histogram | undefined {
        if(!histogram)
            return undefined
        return new Histogram(
            Value.of(histogram.overallCount),
            Value.of(this.convertHistogramBuckets(histogram.buckets)),
            Value.of(new BigDecimal(histogram.min?.valueString!)),
            Value.of(new BigDecimal(histogram.max?.valueString!))
        )
    }
}
