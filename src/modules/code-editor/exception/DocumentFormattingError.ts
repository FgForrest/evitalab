import { LabError } from '@/modules/base/exception/LabError'

/**
 * Thrown when a document cannot be prettified or minified, most commonly because it cannot be parsed
 * or because it carries no formattable content at all.
 */
export class DocumentFormattingError extends LabError {

    constructor(detail: string) {
        super(
            'DocumentFormattingError',
            `Could not format the document: ${detail}`,
            detail
        )
    }
}
