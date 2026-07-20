/**
 * Health of the system change-data-capture stream maintained by the `DataCacheRefresher`, surfaced
 * in the workspace status bar.
 */
export enum ChangeStreamStatus {
    /** The stream is being (re)opened and has not been acknowledged yet. */
    Connecting = 'connecting',
    /** The stream is live and the client-side caches are kept in sync. */
    UpToDate = 'upToDate',
    /** The stream is broken (failed to open, errored, or went silent); a reconnect is pending. */
    Broken = 'broken'
}
