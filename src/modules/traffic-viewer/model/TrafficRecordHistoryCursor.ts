/**
 * Position in the traffic record history of a single catalog from which the next page of records is read.
 *
 * The history is always read **backwards** — the server returns the newest record first — so the cursor
 * walks from the newest end of the server's ring buffer towards its oldest end. An undefined
 * {@link sinceSessionSequenceId} means "start at the newest record the server has".
 *
 * The cursor never carries a record session offset of its own when it crosses a session boundary. In the
 * reversed direction the server applies `recordSessionOffset <= sinceRecordSessionOffset` to the boundary
 * session only, so sending `0` instead of leaving the offset unset would return just the very first record
 * of that session and silently skip the rest of it.
 */
export class TrafficRecordHistoryCursor {

    /**
     * Session sequence order of the oldest session the history may reach. Records of older sessions are
     * never loaded. Sessions are numbered from 1, so the default floor covers the entire history.
     */
    private readonly floor: bigint

    private _sinceSessionSequenceId: bigint | undefined = undefined
    private _sinceRecordSessionOffset: number | undefined = undefined
    private _exhausted: boolean = false

    constructor(floor?: bigint) {
        this.floor = floor != undefined && floor > 1n ? floor : 1n
    }

    /**
     * Session sequence order the next page should start at, undefined when the newest records are wanted.
     */
    get sinceSessionSequenceId(): bigint | undefined {
        return this._sinceSessionSequenceId
    }

    /**
     * Record offset within {@link sinceSessionSequenceId} the next page should start at, undefined when
     * the whole session is wanted.
     */
    get sinceRecordSessionOffset(): number | undefined {
        return this._sinceRecordSessionOffset
    }

    /**
     * Whether the cursor has walked past the oldest reachable record, in which case there is nothing more
     * to load.
     */
    get exhausted(): boolean {
        return this._exhausted
    }

    /**
     * Whether a record of the passed session is still within the reachable part of the history. The server
     * cannot express a lower bound on a backwards read, so pages have to be filtered by the caller.
     */
    covers(sessionSequenceOrder: bigint): boolean {
        return sessionSequenceOrder >= this.floor
    }

    /**
     * Moves the cursor back to the newest end of the history.
     */
    reset(): void {
        this._sinceSessionSequenceId = undefined
        this._sinceRecordSessionOffset = undefined
        this._exhausted = false
    }

    /**
     * Moves the cursor right before the passed record, which is expected to be the oldest record of the
     * page just fetched. Marks the cursor exhausted when the resulting position would fall below the floor.
     */
    moveBefore(sessionSequenceOrder: bigint, recordSessionOffset: number): void {
        if (recordSessionOffset > 0) {
            this._sinceSessionSequenceId = sessionSequenceOrder
            this._sinceRecordSessionOffset = recordSessionOffset - 1
        } else {
            this._sinceSessionSequenceId = sessionSequenceOrder - 1n
            this._sinceRecordSessionOffset = undefined
        }
        this._exhausted = this._sinceSessionSequenceId < this.floor
    }
}
