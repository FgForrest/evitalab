import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { LabServerDataCache } from '@/modules/storage/LabServerDataCache'
import {
    isServerUnreachable,
    markServerUnreachable,
    resetServerConnectivity
} from '@/modules/database-driver/model/serverConnectivity'
import { ConnectivityAwareToaster } from '@/modules/notification/service/ConnectivityAwareToaster'
import type { Toaster } from '@/modules/notification/service/Toaster'

/**
 * Reachability observed on the **HTTP** funnel. The gRPC interceptor cannot carry this alone: a user working
 * only in a GraphQL console produces no gRPC traffic at all, so one transient fetch failure used to latch
 * evitaLab "offline" — offline badge lit, every title-only error toast swallowed — until some unrelated gRPC
 * call happened to succeed.
 */

function newClient(): EvitaClient {
    return new EvitaClient(
        {} as never,
        { getConnection: () => ({ name: 'test', grpcUrl: 'http://localhost:1' }) } as never,
        new LabServerDataCache(`http://localhost:5555/${Math.random()}`)
    )
}

/** Answers every request with the given status, without any network. */
function stubFetch(status: number): void {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', {
        status,
        headers: { 'content-type': 'application/json' }
    })))
}

beforeEach(() => {
    resetServerConnectivity()
})
afterEach(() => {
    vi.unstubAllGlobals()
    resetServerConnectivity()
})

describe('the HTTP client is a reachability funnel of its own', () => {
    test('a successful response clears the offline state', async () => {
        stubFetch(200)
        markServerUnreachable()

        await newClient().httpClient.get('http://localhost:1/whatever')

        expect(isServerUnreachable()).toBe(false)
    })

    test('an error response clears it too — the server answered', async () => {
        stubFetch(404)
        markServerUnreachable()

        await expect(newClient().httpClient.get('http://localhost:1/whatever')).rejects.toThrow()

        // reachability is about whether the server responds at all, not about what it responded
        expect(isServerUnreachable()).toBe(false)
    })

    test('a failure to reach the server at all leaves the offline state alone', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))
        markServerUnreachable()

        // `retry: 0` only keeps the test quick; ky's backoff has nothing to do with what is asserted
        await expect(newClient().httpClient.get('http://localhost:1/whatever', { retry: 0 })).rejects.toThrow()

        expect(isServerUnreachable()).toBe(true)
    })

    test('notifications are delivered again once HTTP traffic proved the server is back', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {})
        const reported: string[] = []
        const delegate: Toaster = {
            success: async () => {},
            info: async () => {},
            warning: async () => {},
            error: async (title: string) => { reported.push(title) }
        }
        const toaster: ConnectivityAwareToaster = new ConnectivityAwareToaster(delegate)

        markServerUnreachable()
        await toaster.error('Could not load schema: [unknown] Failed to fetch')
        await toaster.error('Could not load schema: [unknown] Failed to fetch')
        expect(reported).toHaveLength(1)

        stubFetch(200)
        await newClient().httpClient.get('http://localhost:1/whatever')

        // the symptom of the missing recovery signal: every title-only failure kept being attributed to an
        // outage that was long over
        await toaster.error('Could not rename catalog: name already used')
        expect(reported[reported.length - 1]).toBe('Could not rename catalog: name already used')
    })
})
