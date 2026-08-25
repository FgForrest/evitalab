import { describe, expect, test } from 'vitest'
import { ErrorSummary } from '@/modules/base/exception/ErrorSummary'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { LabError } from '@/modules/base/exception/LabError'
import type { ErrorSummaryDto } from '@/modules/base/exception/ErrorSummaryDto'

/**
 * A {@link LabError} whose stack is suppressed, to tell the detail carried by the error apart from the trace appended
 * to it.
 */
class DetaillessError extends LabError {
    constructor() {
        super('DetaillessError', 'Something went wrong')
        this.stack = undefined
    }
}

describe('ErrorSummary', () => {
    test('flattens the error including its stack trace', () => {
        const error: UnexpectedError = new UnexpectedError('the catalog is gone')

        const summary: ErrorSummary = ErrorSummary.fromError(error)

        expect(summary.name).toBe('UnexpectedError')
        expect(summary.message).toBe('Unexpected error occurred: the catalog is gone')
        expect(summary.detail).toContain('the catalog is gone')
        expect(summary.detail).toContain('ErrorSummary.test.ts')
    })

    test('an error with neither detail nor stack has no detail at all', () => {
        expect(ErrorSummary.fromError(new DetaillessError()).detail).toBeUndefined()
    })

    /**
     * The reason the summary exists: `LabError.detail` appends the stack of whatever object it is read from, so
     * rehydrating an error would grow a second trace with every round trip.
     */
    test('a round trip changes nothing about the report', () => {
        const summary: ErrorSummary = ErrorSummary.fromError(new UnexpectedError('boom'))

        const restored: ErrorSummary = ErrorSummary.restore(summary.toSerializable())

        expect(restored.toSerializable()).toEqual(summary.toSerializable())
        expect(ErrorSummary.restore(restored.toSerializable()).detail).toBe(summary.detail)
    })

    test('a serialized error without a name is rejected', () => {
        expect(() => ErrorSummary.restore({ message: 'no name here' } as ErrorSummaryDto))
            .toThrow(UnexpectedError)
    })

    test('an empty detail is restored as no detail', () => {
        const restored: ErrorSummary = ErrorSummary.restore({ name: 'QueryError', message: 'failed', detail: '' })

        expect(restored.detail).toBeUndefined()
    })
})
