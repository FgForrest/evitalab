import { describe, expect, test } from 'vitest'
import { ErrorViewerTabParams } from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabParams'
import { ErrorSummary } from '@/modules/base/exception/ErrorSummary'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import type {
    ErrorViewerTabParamsDto
} from '@/modules/error-viewer/viewer/workspace/model/ErrorViewerTabParamsDto'

describe('ErrorViewerTabParams', () => {
    /**
     * The params used to serialize to `{}`, which made an error tab unrestorable and unshareable.
     */
    test('the serialized params carry the whole error', () => {
        const params: ErrorViewerTabParams = new ErrorViewerTabParams(
            ErrorSummary.fromError(new UnexpectedError('the catalog is gone'))
        )

        const dto: ErrorViewerTabParamsDto = params.toSerializable()

        expect(dto.error.name).toBe('UnexpectedError')
        expect(dto.error.detail).toContain('the catalog is gone')
        expect(JSON.parse(JSON.stringify(dto))).toEqual(dto)
    })

    test('the params survive a serialization round trip', () => {
        const params: ErrorViewerTabParams = new ErrorViewerTabParams(
            ErrorSummary.fromError(new UnexpectedError('boom'))
        )

        const restored: ErrorViewerTabParams = new ErrorViewerTabParams(
            ErrorSummary.restore(JSON.parse(JSON.stringify(params.toSerializable())).error)
        )

        expect(restored.toSerializable()).toEqual(params.toSerializable())
    })
})
