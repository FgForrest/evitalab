import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { List as ImmutableList } from 'immutable'
import { EvitaClient } from '@/modules/database-driver/EvitaClient'
import { LabServerDataCache } from '@/modules/storage/LabServerDataCache'
import { RestInstanceType } from '@/modules/database-driver/connector/rest/model/RestInstanceType'
import { RestHttpMethod } from '@/modules/database-driver/connector/rest/model/RestHttpMethod'
import { RestRequest } from '@/modules/database-driver/connector/rest/model/RestRequest'
import type { RestResponse } from '@/modules/database-driver/connector/rest/model/RestResponse'
import { EvitaDBInstanceNetworkError } from '@/modules/database-driver/exception/EvitaDBInstanceNetworkError'
import { resetServerConnectivity } from '@/modules/database-driver/model/serverConnectivity'

/**
 * `EvitaClient.callRest` — the REST console's only way to the server. Error statuses are an answer the console
 * displays, so they must come back as a response; only transport failures are thrown.
 */

function newClient(): EvitaClient {
    return new EvitaClient(
        { serverName: 'lab' } as never,
        { getConnection: () => ({ name: 'test', grpcUrl: 'http://localhost:1', restUrl: 'http://localhost:1/rest' }) } as never,
        new LabServerDataCache(`http://localhost:5555/${Math.random()}`)
    )
}

let requests: Request[]
let bodies: string[]

function stubResponse(status: number, body: string): void {
    vi.stubGlobal('fetch', vi.fn(async (request: Request) => {
        requests.push(request)
        bodies.push(request.body == null ? '' : await new Response(request.body).text())
        return new Response(body, { status, statusText: status === 200 ? 'OK' : 'Bad Request' })
    }))
}

beforeEach(() => {
    requests = []
    bodies = []
    resetServerConnectivity()
})
afterEach(() => {
    vi.unstubAllGlobals()
    resetServerConnectivity()
})

describe('REST API calls', () => {
    test('Should send the request to the instance with repeated keys for arrays', async () => {
        stubResponse(200, '{"primaryKey":1}')

        const response: RestResponse = await newClient().callRest(
            'evita',
            RestInstanceType.Catalog,
            new RestRequest(RestHttpMethod.Get, '/Product/get', ImmutableList([['scope', 'LIVE'], ['scope', 'ARCHIVED']]))
        )

        expect(requests[0]?.url).toBe('http://localhost:1/rest/evita/Product/get?scope=LIVE&scope=ARCHIVED')
        expect(requests[0]?.method).toBe('GET')
        expect(requests[0]?.headers.get('Accept')).toBe('application/json')
        expect(requests[0]?.headers.get('X-EvitaDB-ClientID')).toBe('evitaLab-lab')
        expect(requests[0]?.headers.get('Content-Type')).toBeNull()
        expect(response.status).toBe(200)
        expect(response.successful).toBe(true)
        expect(response.bodyText).toBe('{"primaryKey":1}')
        expect(response.sizeBytes).toBe(16)
    })

    test('Should send the body as JSON', async () => {
        stubResponse(200, '{}')

        await newClient().callRest(
            'evita',
            RestInstanceType.Catalog,
            new RestRequest(RestHttpMethod.Post, '/en/Product/query', ImmutableList(), '{"require":{}}')
        )

        expect(requests[0]?.method).toBe('POST')
        expect(requests[0]?.headers.get('Content-Type')).toBe('application/json')
        expect(bodies[0]).toBe('{"require":{}}')
    })

    test('Should call the system API without a catalog in the path', async () => {
        stubResponse(200, '[]')

        await newClient().callRest('system', RestInstanceType.System, new RestRequest(RestHttpMethod.Get, '/catalogs'))

        expect(requests[0]?.url).toBe('http://localhost:1/rest/system/catalogs')
    })

    test('Should return an error status as a response, never retrying it', async () => {
        stubResponse(400, '{"errorCode":"E1","message":"Could not parse query"}')

        const response: RestResponse = await newClient().callRest(
            'evita',
            RestInstanceType.Catalog,
            new RestRequest(RestHttpMethod.Delete, '/Product/1')
        )

        expect(response.status).toBe(400)
        expect(response.successful).toBe(false)
        expect(response.bodyText).toContain('Could not parse query')
        expect(requests).toHaveLength(1)
    })

    test('Should transform a transport failure like every other driver call', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch') }))

        await expect(newClient().callRest('evita', RestInstanceType.Catalog, new RestRequest(RestHttpMethod.Get, '/collections')))
            .rejects.toBeInstanceOf(EvitaDBInstanceNetworkError)
    })
})
