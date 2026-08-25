import { LabError } from '@/modules/base/exception/LabError'
import type { ErrorSummaryDto } from '@/modules/base/exception/ErrorSummaryDto'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

/**
 * Everything about an occurred error that outlives the error object itself: the type name, the message shown to the
 * user and the detail with the stack trace.
 *
 * A {@link LabError} cannot be persisted or transferred - it is abstract, its constructor is protected and its
 * `detail` appends the live `stack` of whichever object it is read from, so reconstructing one would append the stack
 * of the restore site to the original report. This value object is therefore flattened out of the error the moment it
 * is handed over for display, and it is that flattened form which travels into storage and into shared links.
 */
export class ErrorSummary {

    /**
     * Type name of the original error, used as its human-readable label.
     */
    readonly name: string

    /**
     * Message the error was reported to the user with.
     */
    readonly message: string

    /**
     * Full report of the error including its stack trace, or `undefined` when the error carried neither.
     */
    readonly detail: string | undefined

    constructor(name: string, message: string, detail: string | undefined) {
        this.name = name
        this.message = message
        this.detail = detail
    }

    /**
     * Flattens an occurred error. An error that carries no detail and no stack trace yields `undefined` detail, so
     * that the absence can be told apart from an empty report.
     */
    static fromError(error: LabError): ErrorSummary {
        const detail: string = error.detail
        return new ErrorSummary(
            error.name,
            error.message,
            detail.length === 0 ? undefined : detail
        )
    }

    /**
     * Reconstructs the summary from its serialized form. The input may come from a shared link, hence the validation.
     */
    static restore(dto: ErrorSummaryDto): ErrorSummary {
        if (typeof dto?.name !== 'string' || dto.name.length === 0) {
            throw new UnexpectedError('The serialized error is invalid: missing error name.')
        }
        return new ErrorSummary(
            dto.name,
            typeof dto.message === 'string' ? dto.message : '',
            typeof dto.detail === 'string' && dto.detail.length > 0 ? dto.detail : undefined
        )
    }

    toSerializable(): ErrorSummaryDto {
        return {
            name: this.name,
            message: this.message,
            detail: this.detail
        }
    }
}
