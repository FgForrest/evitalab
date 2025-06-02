import {
    GrpcExtraResults,
    GrpcFacetGroupStatistics,
    GrpcFacetStatistics,
    GrpcHierarchy,
    GrpcHistogram,
    GrpcHistogram_GrpcBucket,
    GrpcLevelInfo,
    GrpcLevelInfos,
} from '@/modules/database-driver/connector/grpc/gen/GrpcExtraResults_pb'
import Immutable, { List } from 'immutable'
import { EntityConverter } from './EntityConverter'
import { Histogram } from '@/modules/database-driver/request-response/data/Histogram'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { HistogramBucket } from '@/modules/database-driver/request-response/data/HistogramBucket'
import { FacetGroupStatistics } from '@/modules/database-driver/request-response/data/FacetGroupStatistics'
import { FacetStatistics } from '@/modules/database-driver/request-response/data/FacetStatistics'
import { GrpcEntityReference } from '@/modules/database-driver/connector/grpc/gen/GrpcEntity_pb'
import { EntityReference } from '@/modules/database-driver/request-response/data/EntityReference'
import { Hierarchy } from '@/modules/database-driver/request-response/data/Hierarchy'
import { LevelInfo } from '@/modules/database-driver/request-response/data/LevelInfo'
import { ExtraResults } from '@/modules/database-driver/request-response/data/ExtraResults'

export class ExtraResultConverter {
    private readonly entityConverter: EntityConverter

    constructor(entityConverter: EntityConverter){
        this.entityConverter = entityConverter
    }

    convert(entity: GrpcExtraResults | undefined): ExtraResults | undefined {
        if(!entity)
            return undefined
        return new ExtraResults(
            this.convertAttributeHistogram(entity.attributeHistogram),
            this.convertFacetGroupStatistics(entity.facetGroupStatistics),
            this.convertHierarchy(entity.hierarchy),
            this.convertHistogram(entity.priceHistogram),
            this.convertSelfHierarchy(entity.selfHierarchy)
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
                    histogram.overallCount,
                    this.convertHistogramBuckets(histogram.buckets),
                    new BigDecimal(histogram.min?.valueString!),
                    new BigDecimal(histogram.max?.valueString!)
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
                    bucket.occurrences,
                    bucket.requested,
                    new BigDecimal(bucket.threshold?.valueString!)
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
                    facetGroupStatistic.count,
                    this.convertFacetStatistics(
                        facetGroupStatistic.facetStatistics
                    ),
                    this.convertEntityReference(
                        facetGroupStatistic.groupEntityReference
                    ),
                    facetGroupStatistic.groupEntity
                        ? this.entityConverter.convert(
                              facetGroupStatistic.groupEntity
                          )
                        : undefined
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
                    facetStatistic.requested,
                    facetStatistic.count,
                    facetStatistic.hasSense,
                    facetStatistic.facetEntity
                        ? this.entityConverter.convert(
                              facetStatistic.facetEntity
                          )
                        : undefined,
                    facetStatistic.impact,
                    facetStatistic.matchCount,
                    this.convertEntityReference(
                        facetStatistic.facetEntityReference
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
        return new Hierarchy(Immutable.Map(levelInfos))
    }

    convertLevelInfos(levelInfos: GrpcLevelInfos): List<LevelInfo> {
        const newLevelInfos: LevelInfo[] = []
        for (const levelInfo of levelInfos.levelInfos) {
            newLevelInfos.push(
                new LevelInfo(
                    this.convertLevelInfo(levelInfo.items),
                    levelInfo.requested,
                    levelInfo.childrenCount,
                    levelInfo.queriedEntityCount,
                    levelInfo.entity
                        ? this.entityConverter.convert(levelInfo.entity)
                        : undefined,
                    this.convertEntityReference(levelInfo.entityReference)
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
                    this.convertLevelInfo(info.items),
                    info.requested,
                    info.childrenCount,
                    info.queriedEntityCount,
                    info.entity
                        ? this.entityConverter.convert(info.entity)
                        : undefined,
                    this.convertEntityReference(info.entityReference)
                )
            )
        }
        return Immutable.List(levelInfos)
    }

    convertHistogram(histogram: GrpcHistogram | undefined): Histogram | undefined {
        if(!histogram)
            return undefined
        return new Histogram(
            histogram.overallCount,
            this.convertHistogramBuckets(histogram.buckets),
            new BigDecimal(histogram.min?.valueString!),
            new BigDecimal(histogram.max?.valueString!)
        )
    }
}
