import LZString from 'lz-string'
import { SerializableTabObject } from '@/modules/workspace/tab/model/SerializableTabObject'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

/**
 * Name of the URL query parameter carrying the shared tab hash.
 */
const sharedTabParamName: string = 'sharedTab'

/**
 * Used to share a tab and its data between browsers (users).
 */
export class ShareTabObject extends SerializableTabObject {

    constructor(tabType: TabType, tabParams: TabParamsDto, tabData: TabDataDto | undefined) {
        super(tabType, tabParams, tabData)
    }

    /**
     * Parses a shared tab from the raw value of the `sharedTab` URL query parameter (the hash).
     * Strict variant used when the hash is known to come from the URL.
     *
     * @param param the raw `sharedTab` query parameter value
     */
    static fromLinkParam(param: string): ShareTabObject {
        return ShareTabObject.fromHash(param)
    }

    /**
     * Parses a shared tab from arbitrary user-pasted input, which may be either the bare hash
     * (the `sharedTab` query parameter value) or an entire share URL containing the `sharedTab`
     * query parameter. Throws {@link UnexpectedError} with a descriptive message when the input
     * cannot be interpreted as a valid shared tab.
     *
     * @param input the pasted hash or share URL
     */
    static fromLinkParamOrUrl(input: string): ShareTabObject {
        const trimmedInput: string = input?.trim() ?? ''
        if (trimmedInput.length === 0) {
            throw new UnexpectedError('The input is empty; paste a shared tab hash or link.')
        }

        let hash: string
        if (trimmedInput.includes(`${sharedTabParamName}=`)) {
            hash = ShareTabObject.extractHashFromUrl(trimmedInput)
        } else {
            hash = trimmedInput
        }

        return ShareTabObject.fromHash(hash)
    }

    toLinkParam(): string {
        const serialized = JSON.stringify(this)
        return LZString.compressToEncodedURIComponent(serialized)
    }

    /**
     * Extracts the `sharedTab` query parameter value from a share URL. Falls back to a regex
     * when the input is not a fully valid URL (e.g. copied without a scheme).
     */
    private static extractHashFromUrl(input: string): string {
        try {
            const url: URL = new URL(input)
            const hash: string | null = url.searchParams.get(sharedTabParamName)
            if (hash != undefined && hash.length > 0) {
                return hash
            }
        } catch (e) {
            // not a fully valid URL, fall through to the regex fallback
        }

        const match: RegExpMatchArray | null = input.match(/[?&]sharedTab=([^&#\s]+)/)
        if (match == undefined || match[1].length === 0) {
            throw new UnexpectedError('The link does not contain a shared tab.')
        }
        return match[1]
    }

    /**
     * Decompresses and deserializes a shared tab from the hash, validating the result.
     */
    private static fromHash(hash: string): ShareTabObject {
        const decompressed: string | null = LZString.decompressFromEncodedURIComponent(hash)
        if (decompressed == undefined || decompressed.length === 0) {
            throw new UnexpectedError('The value is not a valid shared tab hash.')
        }

        let json: any
        try {
            json = JSON.parse(decompressed)
        } catch (e) {
            throw new UnexpectedError('The value is not a valid shared tab hash.')
        }

        if (json == undefined || json.tabType == undefined) {
            throw new UnexpectedError('The value is not a valid shared tab hash.')
        }

        return new ShareTabObject(json.tabType, json.tabParams, json.tabData)
    }
}
