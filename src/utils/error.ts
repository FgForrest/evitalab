/**
 * Extracts a human-readable message from an unknown thrown value.
 *
 * Under `useUnknownInCatchVariables` a caught error is typed `unknown`, so its
 * `message` cannot be read directly. This helper narrows the common cases
 * (`Error` instances and plain strings) and falls back to `String(e)`.
 */
export function errorMessage(e: unknown): string {
    if (e instanceof Error) {
        return e.message
    }
    if (typeof e === 'string') {
        return e
    }
    return String(e)
}

/**
 * Narrows an unknown thrown value to an `Error` when possible, otherwise `undefined`.
 * Useful for passing a caught value to APIs typed to accept `Error | undefined`.
 */
export function asError(e: unknown): Error | undefined {
    return e instanceof Error ? e : undefined
}
