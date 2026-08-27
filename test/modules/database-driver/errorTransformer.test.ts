import { afterEach, beforeEach, expect, test } from 'vitest'
import { Code, ConnectError } from '@connectrpc/connect'
import { ErrorTransformer } from '@/modules/database-driver/exception/ErrorTransformer'
import { TimeoutError } from '@/modules/database-driver/exception/TimeoutError'
import { EvitaDBInstanceNetworkError } from '@/modules/database-driver/exception/EvitaDBInstanceNetworkError'
import { Connection } from '@/modules/connection/model/Connection'
import {
    isServerUnreachable,
    resetServerConnectivity
} from '@/modules/database-driver/model/serverConnectivity'

/**
 * Since every gRPC call carries the transport-wide deadline, `Code.DeadlineExceeded` reaches this transformer
 * routinely — and its raw message (`[deadline_exceeded] the operation timed out`) would be rendered verbatim by
 * the toaster and by the tab error screen. The codes that callers match on *after* the transformation have to
 * survive it unchanged.
 */

function newTransformer(): ErrorTransformer {
    return new ErrorTransformer({ name: 'test' } as unknown as Connection)
}

beforeEach(() => {
    resetServerConnectivity()
})
afterEach(() => {
    resetServerConnectivity()
})

test('Should transform an exceeded deadline into a presentable timeout error', () => {
    const transformed: Error = newTransformer()
        .transformError(new ConnectError('the operation timed out', Code.DeadlineExceeded))

    expect(transformed).toBeInstanceOf(TimeoutError)
    expect(transformed.message).not.toContain('deadline_exceeded')
})

test('Should transform an unavailable server into a network error', () => {
    const transformed: Error = newTransformer()
        .transformError(new ConnectError('connection refused', Code.Unavailable))

    expect(transformed).toBeInstanceOf(EvitaDBInstanceNetworkError)
})

test('Should pass a cancellation through unchanged so callers can recognize it', () => {
    const cancellation: ConnectError = new ConnectError('canceled', Code.Canceled)

    const transformed: Error = newTransformer().transformError(cancellation)

    expect(transformed).toBe(cancellation)
    // a cancellation is not a failure of the server, so it must not flip evitaLab offline
    expect(isServerUnreachable()).toBe(false)
})

test('Should pass an invalid argument through unchanged so callers can recognize it', () => {
    const invalidArgument: ConnectError = new ConnectError(
        'No on-demand traffic recording has been started',
        Code.InvalidArgument
    )

    expect(newTransformer().transformError(invalidArgument)).toBe(invalidArgument)
})

test('Should pass a dropped session through unchanged so the shared session can be replayed', () => {
    const unauthenticated: ConnectError = new ConnectError('session not found', Code.Unauthenticated)

    expect(newTransformer().transformError(unauthenticated)).toBe(unauthenticated)
})

test('Should mark the server unreachable when a deadline is exceeded', () => {
    newTransformer().transformError(new ConnectError('the operation timed out', Code.DeadlineExceeded))

    expect(isServerUnreachable()).toBe(true)
})
