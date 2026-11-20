/**
 * Response of an evitaDB REST API call. Error statuses are a regular response too — only transport failures are
 * thrown.
 */
export class RestResponse {
    readonly status: number
    readonly statusText: string
    readonly bodyText: string
    readonly contentType: string | undefined
    /**
     * Time from sending the request until the whole body was read.
     */
    readonly durationMs: number
    /**
     * Size of the body in bytes (UTF-8).
     */
    readonly sizeBytes: number

    constructor(status: number,
                statusText: string,
                bodyText: string,
                contentType: string | undefined,
                durationMs: number,
                sizeBytes: number) {
        this.status = status
        this.statusText = statusText
        this.bodyText = bodyText
        this.contentType = contentType
        this.durationMs = durationMs
        this.sizeBytes = sizeBytes
    }

    /**
     * Whether the server answered with a 2xx status.
     */
    get successful(): boolean {
        return this.status >= 200 && this.status < 300
    }
}
