import { describe, expect, test } from 'vitest'
import { createGraphQLResultStatus } from '@/modules/graphql-console/console/service/createGraphQLResultStatus'
import type { GraphQLResponse } from '@/modules/database-driver/connector/gql/model/GraphQLResponse'
import type { ConsoleResultStatus } from '@/modules/console/result-status/model/ConsoleResultStatus'

describe('GraphQL result status', () => {
    test('Should report a response without errors as OK with the given size', () => {
        const response: GraphQLResponse = { data: { queryProduct: {} }, errors: [] }
        const status: ConsoleResultStatus = createGraphQLResultStatus(response, 12.3, 42)
        expect(status.successful).toBe(true)
        expect(status.label).toBe('OK')
        expect(status.durationMs).toBe(12.3)
        expect(status.sizeBytes).toBe(42)
        expect(status.request).toBeUndefined()
    })

    test('Should report a response without an errors array as OK', () => {
        const status: ConsoleResultStatus = createGraphQLResultStatus({ data: {} } as GraphQLResponse, 1, 0)
        expect(status.successful).toBe(true)
    })

    test('Should count the errors, a GraphQL server answers them with 200', () => {
        expect(createGraphQLResultStatus({ data: {}, errors: [{}] }, 1, 0).label).toBe('1 error')
        const status: ConsoleResultStatus = createGraphQLResultStatus({ data: {}, errors: [{}, {}] }, 1, 0)
        expect(status.successful).toBe(false)
        expect(status.label).toBe('2 errors')
    })
})
