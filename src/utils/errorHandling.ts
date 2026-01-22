/**
 * Extracts an error message from an unknown error value.
 * Handles Error instances, strings, and other types safely.
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message
    }
    if (typeof error === 'string') {
        return error
    }
    return String(error)
}
