import { describe, expect, test } from 'vitest'
import { createEvitaQLResultStatus } from '@/modules/evitaql-console/console/service/createEvitaQLResultStatus'

describe('evitaQL result status', () => {
    test('Should report a successful query as OK without a size', () => {
        const status = createEvitaQLResultStatus(true, 28)
        expect(status.successful).toBe(true)
        expect(status.label).toBe('OK')
        expect(status.durationMs).toBe(28)
        expect(status.sizeBytes).toBeUndefined()
    })

    test('Should report a refused query as an error', () => {
        const status = createEvitaQLResultStatus(false, 5)
        expect(status.successful).toBe(false)
        expect(status.label).toBe('Error')
    })
})
