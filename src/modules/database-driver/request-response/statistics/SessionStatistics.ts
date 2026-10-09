/**
 * How many sessions are currently open against a catalog. An open read-write session pins a catalog version, which
 * keeps superseded data files from being purged.
 */
export class SessionStatistics {

    readonly activeSessions: number
    readonly activeReadOnlySessions: number
    readonly activeReadWriteSessions: number

    constructor(activeSessions: number, activeReadOnlySessions: number, activeReadWriteSessions: number) {
        this.activeSessions = activeSessions
        this.activeReadOnlySessions = activeReadOnlySessions
        this.activeReadWriteSessions = activeReadWriteSessions
    }
}
