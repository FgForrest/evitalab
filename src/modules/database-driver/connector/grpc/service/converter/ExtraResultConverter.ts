import type {
    GrpcExtraResults,
    GrpcFacetGroupStatistics,
    GrpcFacetStatistics,
    GrpcReferenceGroupStatistics,
    GrpcHierarchy,
    GrpcHistogram,
    GrpcHistogram_GrpcBucket,
    GrpcLevelInfo,
    GrpcLevelInfos,
    GrpcQueryTelemetry,
    GrpcQueryTelemetryMetrics,
    GrpcFormulaPlan,
} from '@/modules/database-driver/connector/grpc/gen/GrpcExtraResults_pb'
import { List as ImmutableList, Map as ImmutableMap } from 'immutable'
import { EntityConverter } from './EntityConverter'
import { Histogram } from '@/modules/database-driver/request-response/data/Histogram'
import { BigDecimal } from '@/modules/database-driver/data-type/BigDecimal'
import { HistogramBucket } from '@/modules/database-driver/request-response/data/HistogramBucket'
import { FacetGroupStatistics } from '@/modules/database-driver/request-response/data/FacetGroupStatistics'
import { ReferenceGroupStatistics } from '@/modules/database-driver/request-response/data/ReferenceGroupStatistics'
import { FacetStatistics } from '@/modules/database-driver/request-response/data/FacetStatistics'
import type { GrpcEntityReference } from '@/modules/database-driver/connector/grpc/gen/GrpcEntity_pb'
import { EntityReference } from '@/modules/database-driver/request-response/data/EntityReference'
import { Hierarchy } from '@/modules/database-driver/request-response/data/Hierarchy'
import { LevelInfo } from '@/modules/database-driver/request-response/data/LevelInfo'
import { ExtraResults } from '@/modules/database-driver/request-response/data/ExtraResults'
import { GrpcQueryPhase } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import { QueryTelemetry } from '@/modules/database-driver/request-response/data/QueryTelemetry'
import { QueryTelemetryMetrics } from '@/modules/database-driver/request-response/data/QueryTelemetryMetrics'
import { FormulaPlan } from '@/modules/database-driver/request-response/data/FormulaPlan'
import { QueryPhase, queryPhaseFromName } from '@/modules/database-driver/request-response/data/QueryPhase'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter'

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
            this.convertReferenceGroupStatistics(entity.referenceGroupStatistics),
            this.convertHierarchy(entity.hierarchy),
            this.convertHistogram(entity.priceHistogram),
            this.convertSelfHierarchy(entity.selfHierarchy),
            this.convertQueryTelemetry(entity.queryTelemetry)
        )
    }

    convertAttributeHistogram(histograms: {
        [key: string]: GrpcHistogram
    }): ImmutableMap<string, Histogram> | undefined {
        const newHistograms = new Map<string, Histogram>()
        for (const [histogramName, histogram] of Object.entries(histograms)) {
            newHistograms.set(
                histogramName,
                new Histogram(
                    histogram.overallCount,
                    this.convertHistogramBuckets(histogram.buckets),
                    new BigDecimal(histogram.min!.valueString),
                    new BigDecimal(histogram.max!.valueString)
                )
            )
        }
        return newHistograms.size === 0 ? undefined : ImmutableMap(newHistograms)
    }

    convertHistogramBuckets(
        buckets: GrpcHistogram_GrpcBucket[]
    ): ImmutableList<HistogramBucket> {
        const newBuckets: HistogramBucket[] = []
        for (const bucket of buckets) {
            newBuckets.push(
                new HistogramBucket(
                    bucket.occurrences,
                    bucket.requested,
                    new BigDecimal(bucket.threshold!.valueString)
                )
            )
        }
        return ImmutableList(newBuckets)
    }

    convertFacetGroupStatistics(
        facetGroupStatistics: GrpcFacetGroupStatistics[]
    ): ImmutableList<FacetGroupStatistics> | undefined {
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
        return newFacetGroupStatistics.length === 0 ? undefined : ImmutableList(newFacetGroupStatistics)
    }

    convertReferenceGroupStatistics(
        referenceGroupStatistics: GrpcReferenceGroupStatistics[]
    ): ImmutableList<ReferenceGroupStatistics> | undefined {
        const newReferenceGroupStatistics: ReferenceGroupStatistics[] = []
        for (const refGroupStatistic of referenceGroupStatistics) {
            const histogramStatistics = new Map<string, Histogram>()
            for (const [histogramName, grpcHistogram] of Object.entries(refGroupStatistic.histogramStatistics)) {
                histogramStatistics.set(
                    histogramName,
                    new Histogram(
                        grpcHistogram.overallCount,
                        this.convertHistogramBuckets(grpcHistogram.buckets),
                        new BigDecimal(grpcHistogram.min!.valueString),
                        new BigDecimal(grpcHistogram.max!.valueString)
                    )
                )
            }
            newReferenceGroupStatistics.push(
                new ReferenceGroupStatistics(
                    refGroupStatistic.referenceName,
                    refGroupStatistic.count,
                    this.convertFacetStatistics(
                        refGroupStatistic.facetStatistics
                    ),
                    this.convertEntityReference(
                        refGroupStatistic.groupEntityReference
                    ),
                    refGroupStatistic.groupEntity
                        ? this.entityConverter.convert(
                              refGroupStatistic.groupEntity
                          )
                        : undefined,
                    ImmutableMap(histogramStatistics)
                )
            )
        }
        return newReferenceGroupStatistics.length === 0 ? undefined : ImmutableList(newReferenceGroupStatistics)
    }

    convertFacetStatistics(
        facetStatistics: GrpcFacetStatistics[]
    ): ImmutableList<FacetStatistics> {
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
        return ImmutableList(newFacetStatistics)
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
    }): ImmutableMap<string, Hierarchy> | undefined {
        const newHierarchy: Map<string, Hierarchy> = new Map<
            string,
            Hierarchy
        >()
        for (const [hierarchyName, grpcHierarchy] of Object.entries(hierarchy)) {
            const newHierarchyData = this.convertHierarchyAttribute(grpcHierarchy)
            newHierarchy.set(hierarchyName, newHierarchyData)
        }
        return newHierarchy.size === 0 ? undefined : ImmutableMap(newHierarchy)
    }

    convertHierarchyAttribute(hierarchy: GrpcHierarchy): Hierarchy {
        const levelInfos: Map<string, ImmutableList<LevelInfo>> = new Map()
        const hierarchyData = hierarchy.hierarchy
        for (const [levelInfoName, grpcLevelInfos] of Object.entries(hierarchyData)) {
            levelInfos.set(
                levelInfoName,
                this.convertLevelInfos(grpcLevelInfos)
            )
        }
        return new Hierarchy(ImmutableMap(levelInfos))
    }

    convertLevelInfos(levelInfos: GrpcLevelInfos): ImmutableList<LevelInfo> {
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
                        : this.convertEntityReference(levelInfo.entityReference)
                )
            )
        }
        return ImmutableList(newLevelInfos)
    }

    convertLevelInfo(levelInfo: GrpcLevelInfo[]): ImmutableList<LevelInfo> {
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
                        : this.convertEntityReference(info.entityReference)
                )
            )
        }
        return ImmutableList(levelInfos)
    }

    convertHistogram(histogram: GrpcHistogram | undefined): Histogram | undefined {
        if(!histogram)
            return undefined
        return new Histogram(
            histogram.overallCount,
            this.convertHistogramBuckets(histogram.buckets),
            new BigDecimal(histogram.min!.valueString),
            new BigDecimal(histogram.max!.valueString)
        )
    }

    /**
     * Converts the query telemetry tree. A step with a phase this evitaLab does not know (a newer server) makes the
     * whole telemetry unavailable instead of failing the query response it is part of.
     */
    convertQueryTelemetry(telemetry: GrpcQueryTelemetry | undefined): QueryTelemetry | undefined {
        if (telemetry == undefined) {
            return undefined
        }
        try {
            return this.convertQueryTelemetryStep(telemetry)
        } catch (e) {
            if (e instanceof UnknownQueryPhaseError) {
                console.warn(`Query telemetry ignored: ${e.message}`)
                return undefined
            }
            throw e
        }
    }

    private convertQueryTelemetryStep(telemetry: GrpcQueryTelemetry): QueryTelemetry {
        return new QueryTelemetry(
            this.convertQueryPhase(telemetry.operation),
            BigInt(telemetry.start),
            BigInt(telemetry.spentTime),
            BigInt(telemetry.selfTime),
            ImmutableList(telemetry.arguments),
            telemetry.startedAt != undefined
                ? EvitaValueConverter.convertGrpcOffsetDateTime(telemetry.startedAt)
                : undefined,
            this.convertQueryTelemetryMetrics(telemetry.metrics),
            this.convertFormulaPlan(telemetry.plan),
            ImmutableList(telemetry.steps.map(step => this.convertQueryTelemetryStep(step)))
        )
    }

    private convertQueryPhase(phase: GrpcQueryPhase): QueryPhase {
        const name: string | undefined = GrpcQueryPhase[phase]
        const queryPhase: QueryPhase | undefined = name != undefined ? queryPhaseFromName(name) : undefined
        if (queryPhase == undefined) {
            throw new UnknownQueryPhaseError(phase)
        }
        return queryPhase
    }

    convertQueryTelemetryMetrics(metrics: GrpcQueryTelemetryMetrics | undefined): QueryTelemetryMetrics | undefined {
        if (metrics == undefined) {
            return undefined
        }
        return new QueryTelemetryMetrics(
            this.convertOptionalInt64(metrics.estimatedCardinality),
            this.convertOptionalInt64(metrics.actualCardinality),
            this.convertOptionalInt64(metrics.estimatedCost),
            this.convertOptionalInt64(metrics.actualCost),
            this.convertOptionalInt64(metrics.recordsReturned),
            this.convertOptionalInt64(metrics.ioFetchCount),
            this.convertOptionalInt64(metrics.ioFetchedSizeBytes),
            metrics.prefetched
        )
    }

    convertFormulaPlan(plan: GrpcFormulaPlan | undefined): FormulaPlan | undefined {
        if (plan == undefined) {
            return undefined
        }
        return new FormulaPlan(
            plan.id,
            plan.refTo,
            BigInt(plan.hash),
            plan.description,
            BigInt(plan.estimatedCost),
            this.convertOptionalInt64(plan.actualCost),
            plan.resultCount,
            ImmutableList(plan.children.map(child => this.convertFormulaPlan(child)!))
        )
    }

    private convertOptionalInt64(value: string | undefined): bigint | undefined {
        return value != undefined ? BigInt(value) : undefined
    }
}

/**
 * Raised while converting a telemetry tree that contains a phase unknown to this evitaLab version.
 */
class UnknownQueryPhaseError extends Error {
    constructor(phase: number) {
        super(`unknown query phase '${phase}'.`)
    }
}
