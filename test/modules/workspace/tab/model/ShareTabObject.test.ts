import { test, expect, describe } from 'vitest'
import { ShareTabObject } from '@/modules/workspace/tab/model/ShareTabObject'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'

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
