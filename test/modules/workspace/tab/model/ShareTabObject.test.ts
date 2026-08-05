import { test, expect, describe } from 'vitest'
import { ShareTabObject } from '@/modules/workspace/tab/model/ShareTabObject'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { MutationHistoryViewerTabData } from '@/modules/history-viewer/model/MutationHistoryViewerTabData'
import { OffsetDateTime, Timestamp } from '@/modules/database-driver/data-type/OffsetDateTime'
import { GrpcChangeCaptureOperation } from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb'

function sampleShareTabObject(): ShareTabObject {
    return new ShareTabObject(
        TabType.EvitaQLConsole,
        { connectionId: 'demo', catalogName: 'evita' } as unknown as TabParamsDto,
        { query: 'query(collection("Product"))' } as unknown as TabDataDto
    )
}

/**
 * Encodes a payload the way an external application building a deep link would.
 */
function encodeToBase64(payload: unknown): string {
    const bytes: Uint8Array = new TextEncoder().encode(JSON.stringify(payload))
    let binary: string = ''
    bytes.forEach((byte: number) => binary += String.fromCharCode(byte))
    return btoa(binary)
}

function toBase64Url(base64: string): string {
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Payload without a connection, as documented for external integrators.
 */
const externalPayload = {
    tabType: 'entityViewer',
    tabParams: { catalogName: 'evita', entityType: 'Product' },
    tabData: { queryLanguage: 'evitaql', filterBy: 'entityPrimaryKeyInSet(103885)' }
}

describe('ShareTabObject.fromLinkParamOrUrl', () => {
    test('round-trips a hash produced by toLinkParam', () => {
        const original: ShareTabObject = sampleShareTabObject()
        const hash: string = original.toLinkParam()

        const parsed: ShareTabObject = ShareTabObject.fromLinkParamOrUrl(hash)

        expect(parsed.tabType).toEqual(original.tabType)
        expect(parsed.tabParams).toEqual(original.tabParams)
        expect(parsed.tabData).toEqual(original.tabData)
    })

    test('accepts a full share URL', () => {
        const hash: string = sampleShareTabObject().toLinkParam()
        const parsed: ShareTabObject = ShareTabObject.fromLinkParamOrUrl(`https://demo.evitadb.io/lab?sharedTab=${hash}`)
        expect(parsed.tabType).toEqual(TabType.EvitaQLConsole)
    })

    test('accepts a URL with additional query params and a trailing fragment', () => {
        const hash: string = sampleShareTabObject().toLinkParam()
        const parsed: ShareTabObject = ShareTabObject.fromLinkParamOrUrl(
            `https://demo.evitadb.io/lab?foo=bar&sharedTab=${hash}&baz=1#section`
        )
        expect(parsed.tabType).toEqual(TabType.EvitaQLConsole)
    })

    test('accepts a URL copied without a scheme', () => {
        const hash: string = sampleShareTabObject().toLinkParam()
        const parsed: ShareTabObject = ShareTabObject.fromLinkParamOrUrl(`demo.evitadb.io/lab?sharedTab=${hash}`)
        expect(parsed.tabType).toEqual(TabType.EvitaQLConsole)
    })

    test('accepts a raw hash with surrounding whitespace', () => {
        const hash: string = sampleShareTabObject().toLinkParam()
        const parsed: ShareTabObject = ShareTabObject.fromLinkParamOrUrl(`  \n${hash}\t `)
        expect(parsed.tabType).toEqual(TabType.EvitaQLConsole)
    })

    test('rejects empty input', () => {
        expect(() => ShareTabObject.fromLinkParamOrUrl('   ')).toThrow(/empty/i)
    })

    test('rejects random text', () => {
        expect(() => ShareTabObject.fromLinkParamOrUrl('this is not a hash')).toThrow(/not a valid shared tab hash/i)
    })

    test('rejects a URL without the sharedTab parameter', () => {
        expect(() => ShareTabObject.fromLinkParamOrUrl('https://demo.evitadb.io/lab?foo=bar'))
            .toThrow(/not a valid shared tab hash/i)
    })

    test('rejects a corrupted hash', () => {
        const hash: string = sampleShareTabObject().toLinkParam()
        const corrupted: string = hash.substring(0, hash.length - 5) + '!!!!!'
        expect(() => ShareTabObject.fromLinkParamOrUrl(corrupted)).toThrow()
    })
})

describe('ShareTabObject with a plain base64 payload', () => {
    test('accepts unpadded base64url, the documented external contract', () => {
        const hash: string = toBase64Url(encodeToBase64(externalPayload))

        expect(hash).not.toContain('=')

        const parsed: ShareTabObject = ShareTabObject.fromLinkParam(hash)

        expect(parsed.tabType).toEqual(TabType.EntityViewer)
        expect(parsed.tabParams).toEqual(externalPayload.tabParams)
        expect(parsed.tabData).toEqual(externalPayload.tabData)
    })

    test('accepts padded base64url', () => {
        const hash: string = encodeToBase64({ tabType: 'entityViewer', tabParams: { catalogName: 'evita', entityType: 'Brand' } })
            .replace(/\+/g, '-')
            .replace(/\//g, '_')

        expect(hash).toContain('=')

        const parsed: ShareTabObject = ShareTabObject.fromLinkParam(hash)

        expect(parsed.tabType).toEqual(TabType.EntityViewer)
        expect(parsed.tabParams).toEqual({ catalogName: 'evita', entityType: 'Brand' })
    })

    test('accepts standard base64 containing plus and slash characters', () => {
        const payload = {
            tabType: 'evitaQLConsole',
            tabParams: { catalogName: 'evita' },
            tabData: { query: "attributeInSet('code','a>>>b','c???d')" }
        }
        const hash: string = encodeToBase64(payload)

        expect(hash).toContain('+')
        expect(hash).toContain('/')

        const parsed: ShareTabObject = ShareTabObject.fromLinkParam(hash)

        expect(parsed.tabType).toEqual(TabType.EvitaQLConsole)
        expect(parsed.tabData).toEqual(payload.tabData)
    })

    test('accepts standard base64 whose plus characters arrived as spaces', () => {
        const payload = {
            tabType: 'evitaQLConsole',
            tabParams: { catalogName: 'evita' },
            tabData: { query: "attributeInSet('code','a>>>b','c???d')" }
        }
        // `URLSearchParams` translates a raw `+` in the query string into a space
        const hash: string = encodeToBase64(payload).replace(/\+/g, ' ')

        expect(hash).toContain(' ')

        expect(ShareTabObject.fromLinkParam(hash).tabData).toEqual(payload.tabData)
    })

    test('survives a URLSearchParams encode and decode hop', () => {
        const payload = {
            tabType: 'evitaQLConsole',
            tabParams: { catalogName: 'evita' },
            tabData: { query: "attributeInSet('code','a>>>b','c???d')" }
        }
        const query: URLSearchParams = new URLSearchParams({ sharedTab: encodeToBase64(payload) })
        const readBack: string = new URLSearchParams(query.toString()).get('sharedTab')!

        expect(ShareTabObject.fromLinkParam(readBack).tabData).toEqual(payload.tabData)
    })

    test('decodes a non-ASCII payload as UTF-8', () => {
        const payload = {
            tabType: 'entityViewer',
            tabParams: { catalogName: 'evita', entityType: 'Product' },
            tabData: { queryLanguage: 'evitaql', filterBy: "attributeEquals('název','Příklad')" }
        }

        const parsed: ShareTabObject = ShareTabObject.fromLinkParam(toBase64Url(encodeToBase64(payload)))

        expect(parsed.tabData).toEqual(payload.tabData)
    })

    test('accepts a payload without any connection', () => {
        const parsed: ShareTabObject = ShareTabObject.fromLinkParam(toBase64Url(encodeToBase64(externalPayload)))

        expect(parsed.tabParams).not.toHaveProperty('connectionId')
    })

    test.each([
        ['a payload that is not JSON', encodeToBase64('just a string')],
        ['a JSON payload without a tab type', toBase64Url(encodeToBase64({ tabParams: { catalogName: 'evita' } }))],
        ['a JSON payload with a non-string tab type', toBase64Url(encodeToBase64({ tabType: 42, tabParams: {} }))]
    ])('rejects %s', (_name: string, hash: string) => {
        expect(() => ShareTabObject.fromLinkParam(hash)).toThrow(/not a valid shared tab hash/i)
    })

    test('reports a decoded payload without tab params separately from an undecodable hash', () => {
        const hash: string = toBase64Url(encodeToBase64({ tabType: 'entityViewer' }))

        expect(() => ShareTabObject.fromLinkParam(hash)).toThrow(/missing tab parameters/i)
    })

    test('rejects a decoded payload with malformed tab data', () => {
        const hash: string = toBase64Url(encodeToBase64({
            tabType: 'entityViewer',
            tabParams: { catalogName: 'evita' },
            tabData: 'not an object'
        }))

        expect(() => ShareTabObject.fromLinkParam(hash)).toThrow(/malformed tab data/i)
    })
})

describe('ShareTabObject.fromLinkParamOrUrl with a base64 payload in a URL', () => {
    const base64url: string = toBase64Url(encodeToBase64(externalPayload))
    // a producer percent-encoding standard base64 emits `%2B` for `+`
    const percentEncodedBase64: string = encodeURIComponent(encodeToBase64({
        tabType: 'evitaQLConsole',
        tabParams: { catalogName: 'evita' },
        tabData: { query: "attributeInSet('code','a>>>b','c???d')" }
    }))

    test('accepts a full URL carrying base64url', () => {
        expect(ShareTabObject.fromLinkParamOrUrl(`https://demo.evitadb.io/lab?sharedTab=${base64url}`).tabType)
            .toEqual(TabType.EntityViewer)
    })

    test('accepts a full URL carrying percent-encoded standard base64', () => {
        expect(ShareTabObject.fromLinkParamOrUrl(`https://demo.evitadb.io/lab?sharedTab=${percentEncodedBase64}`).tabType)
            .toEqual(TabType.EvitaQLConsole)
    })

    test('accepts a scheme-less URL carrying base64url', () => {
        expect(ShareTabObject.fromLinkParamOrUrl(`demo.evitadb.io/lab?sharedTab=${base64url}`).tabType)
            .toEqual(TabType.EntityViewer)
    })

    test('accepts a scheme-less URL carrying percent-encoded standard base64', () => {
        // the regex fallback returns the raw capture, so it has to percent-decode it itself
        expect(ShareTabObject.fromLinkParamOrUrl(`demo.evitadb.io/lab?sharedTab=${percentEncodedBase64}`).tabType)
            .toEqual(TabType.EvitaQLConsole)
    })

    test('rejects a link with a malformed percent sequence', () => {
        expect(() => ShareTabObject.fromLinkParamOrUrl('demo.evitadb.io/lab?sharedTab=%2'))
            .toThrow(/does not contain a valid shared tab/i)
    })
})

describe('ShareTabObject with mutation history viewer time filters', () => {
    // `Timestamp.seconds` is a BigInt, which `JSON.stringify` refuses to serialize; the tab data DTO
    // therefore emits it as a string and the tab factory restores it via `BigInt(...)`. Sharing a
    // mutation history tab carrying `from`/`to` must survive that transport losslessly.
    test('round-trips from/to timestamps through the share link', () => {
        const tabData: MutationHistoryViewerTabData = new MutationHistoryViewerTabData(
            new OffsetDateTime(new Timestamp(BigInt(1735689600), 123), '+02:00'),
            new OffsetDateTime(new Timestamp(BigInt(1767225600), 0), 'Z'),
            42,
            [GrpcChangeCaptureOperation.UPSERT],
            ['code'],
            undefined,
            'Product',
            'dataSite',
            true
        )
        const original: ShareTabObject = new ShareTabObject(
            TabType.MutationHistoryViewer,
            { connectionId: 'demo', connectionName: 'Demo', catalogName: 'evita' } as unknown as TabParamsDto,
            tabData.toSerializable() as unknown as TabDataDto
        )

        const parsed: ShareTabObject = ShareTabObject.fromLinkParam(original.toLinkParam())

        expect(parsed.tabType).toEqual(TabType.MutationHistoryViewer)
        expect(parsed.tabParams).toEqual(original.tabParams)
        expect(parsed.tabData).toEqual(original.tabData)

        const parsedData = parsed.tabData as unknown as { from: { seconds: string, nanos: number, offset: string } }
        expect(BigInt(parsedData.from.seconds)).toEqual(BigInt(1735689600))
        expect(parsedData.from.nanos).toEqual(123)
        expect(parsedData.from.offset).toEqual('+02:00')
    })
})
