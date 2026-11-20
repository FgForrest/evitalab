/**
 * Summary of the last result of a query console, shown by `ResultStatusBar` at the top of the result pane.
 */
export class ConsoleResultStatus {
    /**
     * Whether the server answered without an error — decides the colour of the status chip.
     */
    readonly successful: boolean
    /**
     * Text of the status chip (`200 OK`, `2 errors`, …), already localized where needed.
     */
    readonly label: string
    /**
     * Client-measured time from sending the query until the result was received.
     */
    readonly durationMs: number
    /**
     * Size of the result in bytes, `undefined` where the console cannot know it (gRPC).
     */
    readonly sizeBytes: number | undefined
    /**
     * The executed request (`METHOD path`) where it is not obvious from the editor, `undefined` otherwise.
     */
    readonly request: string | undefined

    constructor(successful: boolean,
                label: string,
                durationMs: number,
                sizeBytes: number | undefined = undefined,
                request: string | undefined = undefined) {
        this.successful = successful
        this.label = label
        this.durationMs = durationMs
        this.sizeBytes = sizeBytes
        this.request = request
    }
}
