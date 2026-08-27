import { Code, ConnectError } from '@connectrpc/connect'
import { EvitaDBInstanceNetworkError } from '@/modules/database-driver/exception/EvitaDBInstanceNetworkError'
import { TimeoutError } from '@/modules/database-driver/exception/TimeoutError'

/**
 * Messages browsers use when `fetch` cannot reach the host at all. Needed because connect-web wraps such a
 * failure into a `ConnectError` with the catch-all {@link Code.Unknown} rather than {@link Code.Unavailable},
 * so the code alone cannot tell "server unreachable" from "server answered with something unexpected".
 *
 * Verified shape against an unreachable endpoint: `ConnectError`, `code = Code.Unknown (2)`,
 * `rawMessage = 'Failed to fetch'`. The rest of the list covers the other engines.
 */
const networkFailureMessages: readonly string[] = [
    'failed to fetch',              // Chromium
    'load failed',                  // Safari
    'networkerror when attempting to fetch resource',  // Firefox
    'network error',
    'network request failed'
]

/**
 * Whether an error means **"the server could not be reached"**, as opposed to the server rejecting or failing
 * the request.
 *
 * Deliberately narrow. {@link Code.Unknown} is a catch-all that a genuine server-side fault also lands in, so
 * it only counts as connectivity when the underlying message is a browser network failure — otherwise real
 * problems would be silently swallowed by the notification suppression this predicate drives.
 *
 * Left out on purpose, because their contracts depend on being distinguishable and none of them is about
 * reachability: {@link Code.Unauthenticated} (the server-dropped-session retry),
 * {@link Code.InvalidArgument} (the already-closed-session swallow) and {@link Code.Canceled} (the documented
 * file-download cancellation contract).
 */
export function isConnectivityError(error: unknown): boolean {
    // errors evitaLab itself raises for an unreachable or unresponsive server
    if (error instanceof EvitaDBInstanceNetworkError || error instanceof TimeoutError) {
        return true
    }

    if (error instanceof ConnectError) {
        if (error.code === Code.Unavailable || error.code === Code.DeadlineExceeded) {
            return true
        }
        if (error.code === Code.Unknown) {
            return isNetworkFailureMessage(error.rawMessage)
        }
        return false
    }

    // A **raw** browser rejection, not yet converted by `ErrorTransformer`. The HTTP (GraphQL/ky) paths surface
    // unreachability this way — `fetch` rejects with a plain `TypeError` — and classification deliberately runs
    // on the raw error, so this shape has to be recognized here or an unreachable server goes unnoticed on
    // every non-gRPC call. Verified against a stopped server: `TypeError`, message `Failed to fetch`.
    const name: string | undefined = (error as { name?: string })?.name
    if (name === 'TypeError') {
        return isNetworkFailureMessage((error as { message?: string })?.message)
    }
    // ky's own timeout, which `ErrorTransformer` turns into our TimeoutError
    if (name === 'TimeoutError') {
        return true
    }

    return false
}

function isNetworkFailureMessage(message: string | undefined): boolean {
    if (message == undefined) {
        return false
    }
    const normalized: string = message.toLowerCase()
    return networkFailureMessages.some(candidate => normalized.includes(candidate))
}
