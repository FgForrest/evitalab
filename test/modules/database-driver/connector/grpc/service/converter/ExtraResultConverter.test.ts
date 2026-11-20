import { describe, expect, test, vi } from 'vitest'
import { create, type MessageInitShape } from '@bufbuild/protobuf'
import { TimestampSchema } from '@bufbuild/protobuf/wkt'
import {
    ExtraResultConverter
} from '@/modules/database-driver/connector/grpc/service/converter/ExtraResultConverter'
import {
    EvitaResponseConverter
} from '@/modules/database-driver/connector/grpc/service/converter/EvitaResponseConverter'
import type { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter'
import {
    GrpcExtraResultsSchema,
    GrpcFormulaPlanSchema,
    GrpcQueryTelemetryMetricsSchema,
    GrpcQueryTelemetrySchema,
    type GrpcFormulaPlan,
    type GrpcQueryTelemetry
} from '@/modules/database-driver/connector/grpc/gen/GrpcExtraResults_pb'
import { GrpcQueryPhase } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import { GrpcOffsetDateTimeSchema } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaDataTypes_pb'
import { GrpcQueryResponseSchema } from '@/modules/database-driver/connector/grpc/gen/GrpcEvitaSessionAPI_pb'
import { QueryPhase } from '@/modules/database-driver/request-response/data/QueryPhase'
import type { QueryTelemetry } from '@/modules/database-driver/request-response/data/QueryTelemetry'

/**
 * There is no captured gRPC telemetry payload, so the messages are built here in the shape evitaDB sends: int64
 * fields as strings (`jstype = JS_STRING`), metrics and plan on the root only, a candidate plan on an alternative.
 */

const unusableEntityConverter: EntityConverter = {} as unknown as EntityConverter
const converter: ExtraResultConverter = new ExtraResultConverter(unusableEntityConverter)

function step(operation: GrpcQueryPhase, start: string, spentTime: string, selfTime: string,
              init: MessageInitShape<typeof GrpcQueryTelemetrySchema> = {}): GrpcQueryTelemetry {
    return create(GrpcQueryTelemetrySchema, { operation, start, spentTime, selfTime, ...init })
}

function plan(id: number, hash: string,
              init: MessageInitShape<typeof GrpcFormulaPlanSchema> = {}): GrpcFormulaPlan {
    return create(GrpcFormulaPlanSchema, { id, hash, estimatedCost: '100', ...init })
}

function sampleTelemetry(): GrpcQueryTelemetry {
    const executedPlan: GrpcFormulaPlan = plan(0, '-5201375408823747239', {
        description: 'AND',
        estimatedCost: '5907',
        actualCost: '9666',
        resultCount: 537,
        children: [
            plan(1, '42', { description: '537 primary keys', actualCost: '0', resultCount: 537 }),
            plan(1, '42', { refTo: 1 })
        ]
    })
    const candidatePlan: GrpcFormulaPlan = plan(0, '-5201375408823747239', {
        description: 'AND',
        estimatedCost: '5907',
        children: [plan(1, '42', { description: '537 primary keys' })]
    })

    return step(GrpcQueryPhase.OVERALL, '0', '3481506', '88305', {
        startedAt: create(GrpcOffsetDateTimeSchema, {
            timestamp: create(TimestampSchema, { seconds: 1791802493n, nanos: 681095255 }),
            offset: 'Z'
        }),
        metrics: create(GrpcQueryTelemetryMetricsSchema, {
            estimatedCardinality: '537',
            actualCardinality: '537',
            recordsReturned: '20',
            ioFetchCount: '0',
            prefetched: false
        }),
        plan: executedPlan,
        steps: [
            step(GrpcQueryPhase.PLANNING, '31940', '2988734', '87197', {
                steps: [
                    step(GrpcQueryPhase.PLANNING_FILTER, '1607085', '1166879', '15432', {
                        arguments: ['Selected index: Index type: REFERENCED_ENTITY composed of 1 indexes'],
                        steps: [
                            step(GrpcQueryPhase.PLANNING_FILTER_ALTERNATIVE, '1608501', '615102', '615102', {
                                plan: candidatePlan
                            })
                        ]
                    })
                ]
            }),
            step(GrpcQueryPhase.EXECUTION, '3076317', '404467', '100207', {
                steps: [
                    step(GrpcQueryPhase.FETCHING_REFERENCE_BODIES, '3100000', '300000', '300000')
                ]
            })
        ]
    })
}

describe('ExtraResultConverter.convertQueryTelemetry', () => {
    test('Should return nothing when no telemetry was requested', () => {
        expect(converter.convertQueryTelemetry(undefined)).toBeUndefined()
        expect(converter.convert(create(GrpcExtraResultsSchema, {}))!.queryTelemetry).toBeUndefined()
    })

    test('Should convert the step tree with int64 fields as bigint', () => {
        const telemetry: QueryTelemetry = converter.convertQueryTelemetry(sampleTelemetry())!

        expect(telemetry.operation).toBe(QueryPhase.Overall)
        expect(telemetry.start).toBe(0n)
        expect(telemetry.spentTime).toBe(3481506n)
        expect(telemetry.selfTime).toBe(88305n)
        expect(telemetry.steps.map(it => it.operation).toArray()).toEqual([QueryPhase.Planning, QueryPhase.Execution])

        const filter: QueryTelemetry = telemetry.steps.get(0)!.steps.get(0)!
        expect(filter.operation).toBe(QueryPhase.PlanningFilter)
        expect(filter.start).toBe(1607085n)
        expect(filter.arguments.toArray()).toEqual(['Selected index: Index type: REFERENCED_ENTITY composed of 1 indexes'])
        expect(telemetry.steps.get(1)!.steps.get(0)!.operation).toBe(QueryPhase.FetchingReferenceBodies)
    })

    test('Should keep startedAt with its nanoseconds on the root only', () => {
        const telemetry: QueryTelemetry = converter.convertQueryTelemetry(sampleTelemetry())!

        expect(telemetry.startedAt!.timestamp.seconds).toBe(1791802493n)
        expect(telemetry.startedAt!.timestamp.nanos).toBe(681095255)
        expect(telemetry.startedAt!.offset).toBe('Z')
        expect(telemetry.steps.get(0)!.startedAt).toBeUndefined()
    })

    test('Should tell absent metrics apart from measured zero', () => {
        const telemetry: QueryTelemetry = converter.convertQueryTelemetry(sampleTelemetry())!

        const metrics = telemetry.metrics!
        expect(metrics.estimatedCardinality).toBe(537n)
        expect(metrics.recordsReturned).toBe(20n)
        expect(metrics.ioFetchCount).toBe(0n)
        expect(metrics.prefetched).toBe(false)
        expect(metrics.estimatedCost).toBeUndefined()
        expect(metrics.actualCost).toBeUndefined()
        expect(metrics.ioFetchedSizeBytes).toBeUndefined()
        expect(telemetry.steps.get(0)!.metrics).toBeUndefined()
    })

    test('Should convert executed and candidate plans with back-references and signed hashes', () => {
        const telemetry: QueryTelemetry = converter.convertQueryTelemetry(sampleTelemetry())!

        const executed = telemetry.plan!
        expect(executed.hash).toBe(-5201375408823747239n)
        expect(executed.estimatedCost).toBe(5907n)
        expect(executed.actualCost).toBe(9666n)
        expect(executed.resultCount).toBe(537)
        expect(executed.refTo).toBeUndefined()

        const reference = executed.children.get(1)!
        expect(reference.refTo).toBe(1)
        expect(reference.description).toBeUndefined()
        expect(reference.children.isEmpty()).toBe(true)

        const candidate = telemetry.steps.get(0)!.steps.get(0)!.steps.get(0)!.plan!
        expect(candidate.hash).toBe(executed.hash)
        expect(candidate.actualCost).toBeUndefined()
        expect(candidate.resultCount).toBeUndefined()
        expect(candidate.children.get(0)!.actualCost).toBeUndefined()
        expect(telemetry.steps.get(1)!.plan).toBeUndefined()
    })

    test('Should drop the telemetry instead of failing the response on an unknown phase', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        const telemetry: GrpcQueryTelemetry = sampleTelemetry()
        // a value no current GrpcQueryPhase member uses — simulates a newer server
        telemetry.steps[1]!.steps[0]!.operation = 999 as GrpcQueryPhase

        expect(converter.convertQueryTelemetry(telemetry)).toBeUndefined()
        vi.restoreAllMocks()
    })

    test('Should map every gRPC query phase', () => {
        const phases: GrpcQueryPhase[] = Object.values(GrpcQueryPhase)
            .filter((it): it is GrpcQueryPhase => typeof it === 'number')
        expect(phases).toHaveLength(22)
        for (const phase of phases) {
            const telemetry: QueryTelemetry = converter.convertQueryTelemetry(step(phase, '0', '1', '1'))!
            expect(telemetry.operation).toBe(GrpcQueryPhase[phase])
        }
    })

    test('Should expose the telemetry on the evitaQL response', () => {
        const responseConverter: EvitaResponseConverter = new EvitaResponseConverter(unusableEntityConverter, converter)
        const response = responseConverter.convert(create(GrpcQueryResponseSchema, {
            extraResults: create(GrpcExtraResultsSchema, { queryTelemetry: sampleTelemetry() })
        }))

        expect(response.extraResults!.queryTelemetry!.spentTime).toBe(3481506n)
        expect(response.rawResponse).toContain('queryTelemetry')
    })
})
