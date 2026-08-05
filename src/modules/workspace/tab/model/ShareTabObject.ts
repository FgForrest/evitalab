import LZString from 'lz-string'
import { SerializableTabObject } from '@/modules/workspace/tab/model/SerializableTabObject'
import { TabType } from '@/modules/workspace/tab/model/TabType'
import type { TabParamsDto } from '@/modules/workspace/tab/model/TabParamsDto'
import type { TabDataDto } from '@/modules/workspace/tab/model/TabDataDto'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'
import { tryDecodeBase64ToUtf8 } from '@/utils/base64'

/**
 * Name of the URL query parameter carrying the shared tab hash.
 */
const sharedTabParamName: string = 'sharedTab'

/**
 * Raw deserialized shared tab payload, before it is validated.
 */
type SharedTabPayload = {
    tabType?: unknown,
    tabParams?: unknown,
    tabData?: unknown
}

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
     * Two hash formats are accepted: the LZ-string compressed payload produced by
     * {@link toLinkParam}, and a plain base64 (or base64url) encoded JSON payload, which allows
     * external applications to deep-link into evitaLab without knowing evitaLab internals.
     *
     * @param param the raw `sharedTab` query parameter value
     */
    static fromLinkParam(param: string): ShareTabObject {
        return ShareTabObject.fromHash(param)
    }

    /**
     * Parses a shared tab from arbitrary user-pasted input, which may be either the bare hash
     * (the `sharedTab` query parameter value) or an entire share URL containing the `sharedTab`
     * query parameter. Both hash formats described in {@link fromLinkParam} are accepted. Throws
     * {@link UnexpectedError} with a descriptive message when the input cannot be interpreted as a
     * valid shared tab.
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
        } catch {
            // not a fully valid URL, fall through to the regex fallback
        }

        const match: RegExpMatchArray | null = input.match(/[?&]sharedTab=([^&#\s]+)/)
        const sharedTab: string | undefined = match?.[1]
        if (sharedTab == undefined || sharedTab.length === 0) {
            throw new UnexpectedError('The link does not contain a shared tab.')
        }
        // unlike `URL.searchParams`, the regex returns the raw capture, which still holds any
        // percent-encoded characters (e.g. `%2B` for the `+` of standard base64)
        try {
            return decodeURIComponent(sharedTab)
        } catch {
            throw new UnexpectedError('The link does not contain a valid shared tab.')
        }
    }

    /**
     * Deserializes a shared tab from the hash, validating the result. Base64 encoded JSON is
     * detected first, because LZ-string decompression reports invalid input by returning nonsense
     * instead of failing, and therefore cannot reliably reject a foreign format.
     */
    private static fromHash(hash: string): ShareTabObject {
        const payload: SharedTabPayload = ShareTabObject.decodeBase64Payload(hash)
            ?? ShareTabObject.decodeCompressedPayload(hash)
        return ShareTabObject.fromPayload(payload)
    }

    /**
     * Decodes a plain base64 (or base64url) encoded JSON payload. Returns `undefined` when the hash
     * is not base64 encoded JSON describing a shared tab, in which case it has to be interpreted as
     * an LZ-string compressed payload instead.
     */
    private static decodeBase64Payload(hash: string): SharedTabPayload | undefined {
        const decoded: string | undefined = tryDecodeBase64ToUtf8(hash)
        if (decoded == undefined || decoded.length === 0) {
            return undefined
        }

        let payload: unknown
        try {
            payload = JSON.parse(decoded)
        } catch {
            return undefined
        }

        // a JSON object carrying a string `tabType` is the only reliable marker of the base64
        // format; anything else is treated as an LZ-string hash that happened to decode as base64
        if (payload == undefined || typeof payload !== 'object') {
            return undefined
        }
        if (typeof (payload as SharedTabPayload).tabType !== 'string') {
            return undefined
        }
        return payload as SharedTabPayload
    }

    /**
     * Decodes the LZ-string compressed JSON payload produced by {@link toLinkParam}.
     */
    private static decodeCompressedPayload(hash: string): SharedTabPayload {
        const decompressed: string | null = LZString.decompressFromEncodedURIComponent(hash)
        if (decompressed == undefined || decompressed.length === 0) {
            throw new UnexpectedError('The value is not a valid shared tab hash.')
        }

        let payload: unknown
        try {
            payload = JSON.parse(decompressed)
        } catch {
            throw new UnexpectedError('The value is not a valid shared tab hash.')
        }

        if (payload == undefined || typeof payload !== 'object') {
            throw new UnexpectedError('The value is not a valid shared tab hash.')
        }
        return payload as SharedTabPayload
    }

    /**
     * Validates the decoded payload and constructs the shared tab from it.
     */
    private static fromPayload(payload: SharedTabPayload): ShareTabObject {
        const tabType: unknown = payload.tabType
        if (typeof tabType !== 'string' || tabType.length === 0) {
            throw new UnexpectedError('The shared tab is invalid: missing tab type.')
        }

        const tabParams: unknown = payload.tabParams
        if (tabParams == undefined || typeof tabParams !== 'object') {
            throw new UnexpectedError(`The shared tab of type '${tabType}' is invalid: missing tab parameters.`)
        }

        const tabData: unknown = payload.tabData
        if (tabData != undefined && typeof tabData !== 'object') {
            throw new UnexpectedError(`The shared tab of type '${tabType}' is invalid: malformed tab data.`)
        }

        return new ShareTabObject(
            tabType as TabType,
            tabParams as TabParamsDto,
            tabData as TabDataDto | undefined
        )
    }
}
