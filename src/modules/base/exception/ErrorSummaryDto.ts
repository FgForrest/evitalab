/**
 * Serializable form of {@link ErrorSummary}.
 */
export type ErrorSummaryDto = {
    name: string,
    message: string,
    detail?: string
}
