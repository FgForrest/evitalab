import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { Code, ConnectError } from '@connectrpc/connect'
import { ConnectivityAwareToaster } from '@/modules/notification/service/ConnectivityAwareToaster'
import type { Toaster } from '@/modules/notification/service/Toaster'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { EvitaDBInstanceNetworkError } from '@/modules/database-driver/exception/EvitaDBInstanceNetworkError'
import { TimeoutError } from '@/modules/database-driver/exception/TimeoutError'
import { EvitaDBInstanceServerError } from '@/modules/database-driver/exception/EvitaDBInstanceServerError'
import {
    markServerReachable,
    markServerUnreachable,
    requestOutageReport,
    resetServerConnectivity
} from '@/modules/database-driver/model/serverConnectivity'

/**
 * Reporting of outages. An unreachable server makes every action that wants fresh data fail, and without this
 * each failure raised its own notification — one user action could bury the screen in near-identical network
 * errors, and a sustained outage kept producing them for as long as it lasted.
 */

interface ReportedError {
    title: string
    error?: Error
}

let reportedErrors: ReportedError[]
let reportedOther: string[]
let toaster: ConnectivityAwareToaster

/** The real shape of an unreachable server, captured from connect-web: `Code.Unknown` + a fetch failure. */
function unreachableServerError(): ConnectError {
    return new ConnectError('Failed to fetch', Code.Unknown)
}

/**
 * Reports a failure the way the majority of call sites do: the reason interpolated into the title, no error
 * object, so there is nothing for the toaster to classify.
 */
function reportWithoutError(title: string): Promise<void> {
    return toaster.error(title)
}

/** What the driver does when a call fails to reach the server, before the component reports it. */
async function failToReachServer(title: string): Promise<void> {
    markServerUnreachable()
    await toaster.error(title, unreachableServerError())
}

beforeEach(() => {
    resetServerConnectivity()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    reportedErrors = []
    reportedOther = []
    const delegate: Toaster = {
        success: async (title: string) => { reportedOther.push(`success:${title}`) },
        info: async (title: string) => { reportedOther.push(`info:${title}`) },
        warning: async (title: string) => { reportedOther.push(`warning:${title}`) },
        error: async (title: string, error?: Error) => { reportedErrors.push({ title, error }) }
    }
    toaster = new ConnectivityAwareToaster(delegate)
})
afterEach(() => {
    vi.restoreAllMocks()
})

describe('an outage is reported once, however long it lasts', () => {
    test('reports the first failure', async () => {
        await failToReachServer('Could not load catalogs')

        expect(reportedErrors).toHaveLength(1)
        // the caller's title is replaced: which of the many failing reads noticed first is noise
        expect(reportedErrors[0]!.title).not.toBe('Could not load catalogs')
        expect(reportedErrors[0]!.error).toBeInstanceOf(ConnectError)
    })

    test('collapses a burst of concurrent failures', async () => {
        // what opening a tab does: a handful of reads all failing at once
        await failToReachServer('Could not load server status')
        await failToReachServer('Could not load catalogs')
        await failToReachServer('Could not load schema')

        expect(reportedErrors).toHaveLength(1)
    })

    test('stays quiet for a sustained outage no matter how many failures accumulate', async () => {
        // the case a time window could not handle: pollers and retries keep failing for minutes, each far
        // enough apart that any window short enough to answer a user action would have expired
        await failToReachServer('initial failure')
        for (let i = 0; i < 50; i++) {
            await failToReachServer(`poll ${i}`)
            await reportWithoutError(`poll ${i} without error object`)
        }

        expect(reportedErrors).toHaveLength(1)
    })

    test('reports the next outage after the server recovered', async () => {
        await failToReachServer('first outage')
        expect(reportedErrors).toHaveLength(1)

        // the transport sees a successful response — the outage is over
        markServerReachable()
        await failToReachServer('second outage')

        // a later outage must not be swallowed by the previous one having been reported
        expect(reportedErrors).toHaveLength(2)
    })

    test('keeps every unreported failure diagnosable in the console', async () => {
        await failToReachServer('first')
        await failToReachServer('unreported')

        expect(reportedErrors).toHaveLength(1)
        // nothing is lost just because it was not shown
        expect(console.error).toHaveBeenCalledTimes(2)
    })

    test('recognizes every shape an unreachable server takes', async () => {
        const connectivityErrors: Error[] = [
            new ConnectError('Failed to fetch', Code.Unknown),
            new ConnectError('Load failed', Code.Unknown),
            new ConnectError('NetworkError when attempting to fetch resource.', Code.Unknown),
            new ConnectError('unavailable', Code.Unavailable),
            new ConnectError('deadline', Code.DeadlineExceeded),
            new EvitaDBInstanceNetworkError(undefined),
            new TimeoutError(undefined),
            // the raw browser rejection, before ErrorTransformer converts it. The HTTP (GraphQL/ky) paths
            // surface unreachability exactly this way, and missing it meant a stopped server went unnoticed
            // on every non-gRPC call — observed against a real server being shut down
            new TypeError('Failed to fetch'),
            Object.assign(new Error('The operation timed out.'), { name: 'TimeoutError' })
        ]

        for (const error of connectivityErrors) {
            resetServerConnectivity()
            reportedErrors = []
            toaster = new ConnectivityAwareToaster({
                success: async () => {},
                info: async () => {},
                warning: async () => {},
                error: async (title: string, e?: Error) => { reportedErrors.push({ title, error: e }) }
            })

            markServerUnreachable()
            await toaster.error('some action failed', error)
            await toaster.error('some action failed', error)

            // recognized as connectivity ⇒ reported once
            expect(reportedErrors, error.message).toHaveLength(1)
        }
    })
})

describe('user-initiated refreshes are always answered', () => {
    // the background retries and pollers that produce most of an outage's failures stay silent, but somebody
    // who explicitly pressed a reload button must not be met with nothing happening

    test('a reload deep into a reported outage is reported again', async () => {
        await failToReachServer('initial failure')
        for (let i = 0; i < 20; i++) {
            await failToReachServer(`poll ${i}`)
        }
        expect(reportedErrors).toHaveLength(1)

        // what the Reload / reload-schema buttons do before they start working
        requestOutageReport()
        await failToReachServer('reload pressed by the user')

        expect(reportedErrors).toHaveLength(2)
    })

    test('each further reload is answered, while the failures between them stay silent', async () => {
        await failToReachServer('initial failure')

        for (let i = 0; i < 3; i++) {
            requestOutageReport()
            await failToReachServer(`reload ${i}`)
            await failToReachServer(`background poll after reload ${i}`)
            await reportWithoutError(`background poll after reload ${i} without error object`)
        }

        // one for the outage itself plus one per reload, and nothing for the background noise in between
        expect(reportedErrors).toHaveLength(4)
    })

    test('a reload also answers when the report carries no error object', async () => {
        markServerUnreachable()
        await reportWithoutError('outage noticed')
        expect(reportedErrors).toHaveLength(1)

        requestOutageReport()
        await reportWithoutError('Could not load catalogs: [unknown] Failed to fetch')

        expect(reportedErrors).toHaveLength(2)
    })
})

describe('failures reported without an error object', () => {
    // the majority of reporting sites interpolate the reason into the title and pass no Error, so there is
    // nothing to classify — the offline state is what attributes them to the outage

    test('are collapsed while the server is unreachable', async () => {
        markServerUnreachable()

        await reportWithoutError('Could not load server status: [unknown] Failed to fetch')
        await reportWithoutError('Could not load catalogs: [unknown] Failed to fetch')
        await reportWithoutError('Could not load available catalogs: [unknown] Failed to fetch')

        expect(reportedErrors).toHaveLength(1)
    })

    test('pass through untouched while the server is reachable', async () => {
        // an ordinary failure that happens to report this way must keep its own message
        await reportWithoutError('Could not rename catalog: name already used')
        await reportWithoutError('Could not rename catalog: name already used')

        expect(reportedErrors.map(it => it.title)).toEqual([
            'Could not rename catalog: name already used',
            'Could not rename catalog: name already used'
        ])
    })

    test('pass through untouched again once the server has recovered', async () => {
        markServerUnreachable()
        await reportWithoutError('outage')
        markServerReachable()

        await reportWithoutError('Could not rename catalog: name already used')

        expect(reportedErrors).toHaveLength(2)
        expect(reportedErrors[1]!.title).toBe('Could not rename catalog: name already used')
    })
})

describe('everything else passes through untouched', () => {
    test('a server-side failure keeps its own title and error, even during an outage', async () => {
        const error: UnexpectedError = new UnexpectedError('Malformed query.')
        markServerUnreachable()

        await toaster.error('Could not execute query', error)
        await toaster.error('Could not execute query', error)

        expect(reportedErrors).toHaveLength(2)
        expect(reportedErrors[0]!.title).toBe('Could not execute query')
        expect(reportedErrors[0]!.error).toBe(error)
    })

    test('a genuine server fault is never mistaken for unreachability', async () => {
        // Code.Unknown is a catch-all: without the message check this would be silently swallowed
        const serverFault: ConnectError = new ConnectError('Internal engine failure', Code.Unknown)

        await toaster.error('Could not execute query', serverFault)
        await toaster.error('Could not execute query', serverFault)

        expect(reportedErrors).toHaveLength(2)
        expect(reportedErrors[0]!.title).toBe('Could not execute query')
    })

    test('a 5xx server error is reported as itself', async () => {
        await toaster.error('Could not load', new EvitaDBInstanceServerError(undefined))
        await toaster.error('Could not load', new EvitaDBInstanceServerError(undefined))

        expect(reportedErrors).toHaveLength(2)
    })

    test('an error-less notification and the other severities are untouched', async () => {
        await toaster.error('Something went wrong')
        await toaster.success('Saved')
        await toaster.info('Note')
        await toaster.warning('Careful')

        expect(reportedErrors).toEqual([{ title: 'Something went wrong', error: undefined }])
        expect(reportedOther).toEqual(['success:Saved', 'info:Note', 'warning:Careful'])
    })
})
