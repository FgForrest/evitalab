import { describe, expect, test } from 'vitest'
import { injectQueryTelemetry } from '@/modules/rest-console/console/service/injectQueryTelemetry'
import {
    QueryTelemetryInjectionError,
    QueryTelemetryInjectionFailureReason
} from '@/modules/console/exception/QueryTelemetryInjectionError'

function reasonOf(body: string): QueryTelemetryInjectionFailureReason | undefined {
    try {
        injectQueryTelemetry(body)
        return undefined
    } catch (e) {
        expect(e).toBeInstanceOf(QueryTelemetryInjectionError)
        return (e as QueryTelemetryInjectionError).reason
    }
}

describe('REST query telemetry injection', () => {
    test('Should add the telemetry requirement into an existing require', () => {
        const injected: unknown = JSON.parse(injectQueryTelemetry('{"filterBy":{},"require":{"page":{"size":2}}}'))
        expect(injected).toEqual({ filterBy: {}, require: { page: { size: 2 }, queryTelemetry: 'PLAN' } })
    })

    test('Should create a missing require', () => {
        expect(JSON.parse(injectQueryTelemetry('{"filterBy":{}}'))).toEqual({
            filterBy: {},
            require: { queryTelemetry: 'PLAN' }
        })
    })

    test('Should treat an empty body as an empty object', () => {
        expect(JSON.parse(injectQueryTelemetry('  '))).toEqual({ require: { queryTelemetry: 'PLAN' } })
    })

    test('Should keep an already requested telemetry and return the original text', () => {
        const body: string = '{ "require": { "queryTelemetry": "TIMINGS" } }'
        expect(injectQueryTelemetry(body)).toBe(body)
    })

    test('Should be idempotent', () => {
        const once: string = injectQueryTelemetry('{}')
        expect(injectQueryTelemetry(once)).toBe(once)
    })

    test('Should refuse invalid JSON, a non-object body and a non-object require', () => {
        expect(reasonOf('{ "require": ')).toBe(QueryTelemetryInjectionFailureReason.Unparseable)
        expect(reasonOf('[1, 2]')).toBe(QueryTelemetryInjectionFailureReason.Unparseable)
        expect(reasonOf('{ "require": [] }')).toBe(QueryTelemetryInjectionFailureReason.Unparseable)
    })
})
