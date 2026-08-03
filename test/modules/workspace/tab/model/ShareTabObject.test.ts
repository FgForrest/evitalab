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
